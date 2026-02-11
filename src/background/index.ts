/**
 * Focus Mode Pro - Background Service Worker
 * Handles focus mode logic, blocking, timers, and coordination
 */

import { storage } from '../lib/storage';
import { messaging } from '../lib/messaging';
import { analytics } from '../lib/analytics';
import {
  Settings,
  FocusStatus,
  TimerMode,
  TimerState,
  UrlCheckResult,
  FocusSession,
  MOTIVATIONAL_QUOTES,
  urlMatchesPattern,
  generateId,
  hashPassword,
} from '../lib/types';

// ============================================================================
// State Management
// ============================================================================

interface FocusState {
  status: FocusStatus;
  mode: TimerMode;
  startTime: number;
  targetDuration: number; // seconds
  pausedAt?: number;
  pausedDuration: number; // total paused time in seconds
  pomodoroCount: number;
  sitesBlockedThisSession: number;
  currentSessionId?: string;
}

let focusState: FocusState = {
  status: 'idle',
  mode: 'pomodoro',
  startTime: 0,
  targetDuration: 0,
  pausedDuration: 0,
  pomodoroCount: 0,
  sitesBlockedThisSession: 0,
};

// Emergency unlock cooldowns per tab
const emergencyUnlockCooldowns: Map<number, number> = new Map();

// ============================================================================
// Extension Lifecycle
// ============================================================================

/** Handle extension installation */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.debug('Focus Mode Pro installed');

    // Set installation timestamp
    await storage.setInstalledAt();

    // Initialize storage with defaults
    await storage.getSettings();
    await storage.getStats();

    // Track installation
    await analytics.track('extension_installed', {
      version: chrome.runtime.getManifest().version,
    });

  } else if (details.reason === 'update') {
    const previousVersion = details.previousVersion;
    const currentVersion = chrome.runtime.getManifest().version;
    console.debug(`Focus Mode Pro updated from ${previousVersion} to ${currentVersion}`);

    // Track update
    await analytics.track('extension_updated', {
      previousVersion,
      currentVersion,
    });
  }
});

// ============================================================================
// Timer Logic
// ============================================================================

/**
 * Get remaining time in seconds
 */
function getRemainingSeconds(): number {
  if (focusState.status === 'idle') return 0;
  if (focusState.mode === 'indefinite') return Infinity;

  const now = Date.now();
  let elapsed: number;

  if (focusState.status === 'paused' && focusState.pausedAt) {
    elapsed = (focusState.pausedAt - focusState.startTime) / 1000;
  } else {
    elapsed = (now - focusState.startTime) / 1000;
  }

  elapsed -= focusState.pausedDuration;
  const remaining = focusState.targetDuration - elapsed;
  return Math.max(0, Math.floor(remaining));
}

/**
 * Get timer state for UI
 */
function getTimerState(): TimerState {
  return {
    status: focusState.status,
    mode: focusState.mode,
    remainingSeconds: getRemainingSeconds(),
    totalSeconds: focusState.targetDuration,
    pomodoroCount: focusState.pomodoroCount,
    sessionsUntilLongBreak: 4 - (focusState.pomodoroCount % 4),
  };
}

/**
 * Start a focus session
 */
async function startFocus(mode: TimerMode, customDuration?: number): Promise<void> {
  const settings = await storage.getSettings();

  let duration: number;
  if (mode === 'pomodoro') {
    duration = settings.pomodoro.focusDuration * 60;
  } else if (mode === 'custom') {
    duration = (customDuration ?? settings.focusMode.customDuration) * 60;
  } else {
    duration = Infinity;
  }

  focusState = {
    status: 'focusing',
    mode,
    startTime: Date.now(),
    targetDuration: duration,
    pausedDuration: 0,
    pomodoroCount: mode === 'pomodoro' ? focusState.pomodoroCount : 0,
    sitesBlockedThisSession: 0,
    currentSessionId: generateId(),
  };

  // Update settings
  await storage.updateSettings({
    focusMode: {
      ...settings.focusMode,
      enabled: true,
      status: 'focusing',
      timerMode: mode,
      currentSessionStart: focusState.startTime,
      pomodoroCount: focusState.pomodoroCount,
    },
  });

  // Set up timer alarm
  if (mode !== 'indefinite') {
    await chrome.alarms.create('focusTimer', {
      delayInMinutes: duration / 60,
    });
  }

  // Set up break reminder alarm
  if (settings.breakReminders.enabled) {
    await chrome.alarms.create('breakReminder', {
      periodInMinutes: settings.breakReminders.intervalMinutes,
    });
  }

  // Update badge
  updateBadge();

  // Track
  await analytics.track('focus_started', { mode, duration: duration / 60 });

  // Notify all tabs to recheck blocking
  messaging.broadcast('GET_FOCUS_STATE');
}

/**
 * Stop focus session
 */
async function stopFocus(completed = false): Promise<void> {
  const settings = await storage.getSettings();

  // Record session
  if (focusState.currentSessionId) {
    const actualDuration = focusState.mode === 'indefinite'
      ? Math.floor((Date.now() - focusState.startTime) / 60000)
      : Math.floor((focusState.targetDuration - getRemainingSeconds()) / 60);

    const session: FocusSession = {
      id: focusState.currentSessionId,
      startTime: focusState.startTime,
      endTime: Date.now(),
      mode: focusState.mode,
      targetDuration: focusState.mode === 'indefinite' ? 0 : focusState.targetDuration / 60,
      actualDuration,
      sitesBlocked: focusState.sitesBlockedThisSession,
      completed,
    };

    await storage.recordSession(session);
  }

  // Clear alarms
  await chrome.alarms.clear('focusTimer');
  await chrome.alarms.clear('breakReminder');

  // Reset state
  focusState = {
    status: 'idle',
    mode: 'pomodoro',
    startTime: 0,
    targetDuration: 0,
    pausedDuration: 0,
    pomodoroCount: completed && focusState.mode === 'pomodoro'
      ? focusState.pomodoroCount + 1
      : focusState.pomodoroCount,
    sitesBlockedThisSession: 0,
  };

  // Update settings
  await storage.updateSettings({
    focusMode: {
      ...settings.focusMode,
      enabled: false,
      status: 'idle',
      pomodoroCount: focusState.pomodoroCount,
    },
  });

  // Clear badge
  chrome.action.setBadgeText({ text: '' });

  // Track
  await analytics.track('focus_stopped', { completed });

  // Notify all tabs
  messaging.broadcast('GET_FOCUS_STATE');
}

/**
 * Pause focus session
 */
async function pauseFocus(): Promise<void> {
  if (focusState.status !== 'focusing') return;

  focusState.status = 'paused';
  focusState.pausedAt = Date.now();

  // Clear timer alarm (will recreate on resume)
  await chrome.alarms.clear('focusTimer');

  const settings = await storage.getSettings();
  await storage.updateSettings({
    focusMode: {
      ...settings.focusMode,
      status: 'paused',
    },
  });

  updateBadge();
  await analytics.track('focus_paused');
}

/**
 * Resume focus session
 */
async function resumeFocus(): Promise<void> {
  if (focusState.status !== 'paused' || !focusState.pausedAt) return;

  // Calculate paused duration
  const pausedTime = (Date.now() - focusState.pausedAt) / 1000;
  focusState.pausedDuration += pausedTime;
  delete focusState.pausedAt;
  focusState.status = 'focusing';

  // Recreate timer alarm with remaining time
  const remaining = getRemainingSeconds();
  if (remaining > 0 && focusState.mode !== 'indefinite') {
    await chrome.alarms.create('focusTimer', {
      delayInMinutes: remaining / 60,
    });
  }

  const settings = await storage.getSettings();
  await storage.updateSettings({
    focusMode: {
      ...settings.focusMode,
      status: 'focusing',
    },
  });

  updateBadge();
  await analytics.track('focus_resumed');
}

/**
 * Start a break
 */
async function startBreak(): Promise<void> {
  const settings = await storage.getSettings();

  const isLongBreak = focusState.pomodoroCount > 0 &&
    focusState.pomodoroCount % settings.pomodoro.sessionsUntilLongBreak === 0;

  const duration = isLongBreak
    ? settings.pomodoro.longBreakDuration * 60
    : settings.pomodoro.shortBreakDuration * 60;

  focusState.status = 'break';
  focusState.startTime = Date.now();
  focusState.targetDuration = duration;
  focusState.pausedDuration = 0;

  await chrome.alarms.create('breakTimer', {
    delayInMinutes: duration / 60,
  });

  const settingsUpdate = await storage.getSettings();
  await storage.updateSettings({
    focusMode: {
      ...settingsUpdate.focusMode,
      status: 'break',
      currentBreakStart: Date.now(),
    },
  });

  // Show notification
  if (settings.notifications.sessionComplete) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title: 'Focus Session Complete!',
      message: `Great work! Take a ${isLongBreak ? 'long' : 'short'} break.`,
    });
  }

  updateBadge();
  await analytics.track('break_started', { isLongBreak });
}

/**
 * End break and optionally start new focus
 */
async function endBreak(startNewFocus = false): Promise<void> {
  await chrome.alarms.clear('breakTimer');

  const settings = await storage.getSettings();

  if (settings.notifications.breakComplete) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title: 'Break Over!',
      message: 'Ready to focus again?',
    });
  }

  focusState.status = 'idle';

  await storage.updateSettings({
    focusMode: {
      ...settings.focusMode,
      status: 'idle',
    },
  });

  chrome.action.setBadgeText({ text: '' });

  if (startNewFocus || settings.pomodoro.autoStartFocus) {
    await startFocus('pomodoro');
  }

  await analytics.track('break_ended');
}

/**
 * Update badge with remaining time
 */
function updateBadge(): void {
  if (focusState.status === 'idle') {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const remaining = getRemainingSeconds();

  if (focusState.mode === 'indefinite') {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#22C55E' });
    return;
  }

  const minutes = Math.ceil(remaining / 60);
  const text = minutes > 99 ? '99+' : String(minutes);

  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({
    color: focusState.status === 'break' ? '#F97316' : '#22C55E',
  });
}

// Update badge every minute
setInterval(updateBadge, 60000);

// ============================================================================
// URL Blocking Logic
// ============================================================================

/**
 * Check if a URL should be blocked
 */
async function checkUrl(url: string): Promise<UrlCheckResult> {
  // Don't block if not in focus mode
  if (focusState.status !== 'focusing') {
    return { blocked: false };
  }

  const settings = await storage.getSettings();

  // Skip checking extension pages
  if (url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('about:') ||
      url.startsWith('edge://')) {
    return { blocked: false };
  }

  // Check whitelist first
  for (const rule of settings.whitelist) {
    if (rule.enabled && urlMatchesPattern(url, rule.pattern, rule.isRegex)) {
      return { blocked: false };
    }
  }

  // Check blocklist
  for (const rule of settings.blocklist) {
    if (rule.enabled && urlMatchesPattern(url, rule.pattern, rule.isRegex)) {
      return {
        blocked: true,
        reason: 'blocklist',
        matchedRule: rule.pattern,
      };
    }
  }

  // Check category presets
  for (const category of settings.categories) {
    if (category.enabled) {
      for (const pattern of category.patterns) {
        if (urlMatchesPattern(url, pattern, false)) {
          return {
            blocked: true,
            reason: 'category',
            matchedRule: `${category.name}: ${pattern}`,
          };
        }
      }
    }
  }

  return { blocked: false };
}

/**
 * Handle navigation and block if needed
 */
async function handleNavigation(tabId: number, url: string): Promise<void> {
  const result = await checkUrl(url);

  if (result.blocked) {
    // Increment blocked counter
    focusState.sitesBlockedThisSession++;
    await storage.incrementSitesBlocked();

    // Redirect to blocked page
    const blockedUrl = chrome.runtime.getURL('blocked.html');
    const params = new URLSearchParams({
      url: encodeURIComponent(url),
      reason: result.reason ?? '',
      rule: result.matchedRule ?? '',
    });

    await chrome.tabs.update(tabId, {
      url: `${blockedUrl}?${params.toString()}`,
    });

    await analytics.track('site_blocked', {
      reason: result.reason,
      rule: result.matchedRule,
    });
  }
}

// ============================================================================
// Web Navigation Listeners
// ============================================================================

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only check main frame
  if (details.frameId !== 0) return;

  await handleNavigation(details.tabId, details.url);
});

chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Only check main frame and handle redirects
  if (details.frameId !== 0) return;
  if (details.transitionType === 'auto_subframe') return;

  await handleNavigation(details.tabId, details.url);
});

// ============================================================================
// Tab Event Listeners
// ============================================================================

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    await handleNavigation(tabId, tab.url);
  }
});

// ============================================================================
// Alarm Handlers
// ============================================================================

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'focusTimer') {
    const settings = await storage.getSettings();

    // Focus session complete
    if (focusState.mode === 'pomodoro') {
      await stopFocus(true);
      if (settings.pomodoro.autoStartBreaks) {
        await startBreak();
      }
    } else {
      await stopFocus(true);
    }
  }

  if (alarm.name === 'breakTimer') {
    await endBreak();
  }

  if (alarm.name === 'breakReminder') {
    const settings = await storage.getSettings();
    if (settings.breakReminders.showNotification && focusState.status === 'focusing') {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
        title: 'Time for a Quick Break',
        message: 'Stand up, stretch, and rest your eyes for a moment.',
      });
    }
  }

  if (alarm.name === 'scheduleCheck') {
    await checkSchedule();
  }
});

// ============================================================================
// Schedule Logic
// ============================================================================

async function checkSchedule(): Promise<void> {
  const settings = await storage.getSettings();

  if (!settings.schedule.enabled) return;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const isScheduledDay = settings.schedule.days.includes(dayOfWeek);
  const isWithinTime = currentTime >= settings.schedule.startTime &&
                       currentTime < settings.schedule.endTime;

  if (isScheduledDay && isWithinTime && focusState.status === 'idle') {
    await startFocus(settings.focusMode.timerMode);
  } else if ((!isScheduledDay || !isWithinTime) && focusState.status === 'focusing') {
    // Only auto-stop if in schedule mode
    // await stopFocus(false);
  }
}

// Set up schedule checking every minute
chrome.alarms.create('scheduleCheck', { periodInMinutes: 1 });

// ============================================================================
// Keyboard Shortcut Handler
// ============================================================================

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-focus') {
    if (focusState.status === 'idle') {
      const settings = await storage.getSettings();
      await startFocus(settings.focusMode.timerMode);
    } else {
      await stopFocus(false);
    }
  }
});

// ============================================================================
// Message Handling
// ============================================================================

messaging.createListener({
  GET_SETTINGS: async () => {
    return storage.getSettings();
  },

  UPDATE_SETTINGS: async (payload: unknown) => {
    await storage.updateSettings(payload as Partial<Settings>);
    return { success: true };
  },

  GET_STATS: async () => {
    return storage.getStats();
  },

  GET_FOCUS_STATE: async () => {
    return getTimerState();
  },

  GET_TIMER_STATE: async () => {
    return getTimerState();
  },

  START_FOCUS: async (payload: unknown) => {
    const { mode, duration } = payload as { mode: TimerMode; duration?: number };
    await startFocus(mode, duration);
    return getTimerState();
  },

  STOP_FOCUS: async () => {
    await stopFocus(false);
    return getTimerState();
  },

  PAUSE_FOCUS: async () => {
    await pauseFocus();
    return getTimerState();
  },

  RESUME_FOCUS: async () => {
    await resumeFocus();
    return getTimerState();
  },

  START_BREAK: async () => {
    await startBreak();
    return getTimerState();
  },

  END_BREAK: async () => {
    await endBreak(false);
    return getTimerState();
  },

  SKIP_BREAK: async () => {
    await endBreak(true);
    return getTimerState();
  },

  CHECK_URL: async (payload: unknown) => {
    const { url } = payload as { url: string };
    return checkUrl(url);
  },

  ADD_TO_BLOCKLIST: async (payload: unknown) => {
    const { pattern, isRegex, category } = payload as {
      pattern: string;
      isRegex?: boolean;
      category?: string;
    };
    return storage.addToBlocklist(pattern, isRegex, category);
  },

  REMOVE_FROM_BLOCKLIST: async (payload: unknown) => {
    const { id } = payload as { id: string };
    await storage.removeFromBlocklist(id);
    return { success: true };
  },

  ADD_TO_WHITELIST: async (payload: unknown) => {
    const { pattern, isRegex } = payload as { pattern: string; isRegex?: boolean };
    return storage.addToWhitelist(pattern, isRegex);
  },

  REMOVE_FROM_WHITELIST: async (payload: unknown) => {
    const { id } = payload as { id: string };
    await storage.removeFromWhitelist(id);
    return { success: true };
  },

  EMERGENCY_UNLOCK: async (payload: unknown, sender) => {
    const settings = await storage.getSettings();

    if (!settings.blockedPage.allowEmergencyUnlock) {
      return { allowed: false, reason: 'Emergency unlock disabled' };
    }

    const tabId = sender.tab?.id;
    if (!tabId) {
      return { allowed: false, reason: 'Invalid tab' };
    }

    // Check cooldown
    const lastUnlock = emergencyUnlockCooldowns.get(tabId);
    const cooldownMs = settings.blockedPage.emergencyCooldownMinutes * 60 * 1000;

    if (lastUnlock && Date.now() - lastUnlock < cooldownMs) {
      const remainingMinutes = Math.ceil((cooldownMs - (Date.now() - lastUnlock)) / 60000);
      return { allowed: false, reason: `Cooldown: ${remainingMinutes} minutes remaining` };
    }

    // Set cooldown
    emergencyUnlockCooldowns.set(tabId, Date.now());

    // Temporarily stop focus for 5 minutes
    await stopFocus(false);

    await analytics.track('emergency_unlock');

    return { allowed: true };
  },

  VERIFY_PASSWORD: async (payload: unknown) => {
    const { password } = payload as { password: string };
    const settings = await storage.getSettings();

    if (!settings.passwordProtection.enabled || !settings.passwordProtection.passwordHash) {
      return { valid: true };
    }

    const hash = await hashPassword(password);
    return { valid: hash === settings.passwordProtection.passwordHash };
  },

  GET_QUOTE: async () => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[randomIndex];
  },

  PING: async () => {
    return 'pong';
  },
});

// ============================================================================
// Initialization
// ============================================================================

// Restore state from storage on startup
async function initializeState(): Promise<void> {
  const settings = await storage.getSettings();

  if (settings.focusMode.enabled && settings.focusMode.currentSessionStart) {
    // Restore focus state
    focusState.status = settings.focusMode.status;
    focusState.mode = settings.focusMode.timerMode;
    focusState.startTime = settings.focusMode.currentSessionStart;
    focusState.pomodoroCount = settings.focusMode.pomodoroCount;

    // Calculate target duration
    if (focusState.mode === 'pomodoro') {
      focusState.targetDuration = settings.pomodoro.focusDuration * 60;
    } else if (focusState.mode === 'custom') {
      focusState.targetDuration = settings.focusMode.customDuration * 60;
    } else {
      focusState.targetDuration = Infinity;
    }

    // Check if session should have ended
    const remaining = getRemainingSeconds();
    if (remaining <= 0 && focusState.mode !== 'indefinite') {
      await stopFocus(true);
    } else {
      updateBadge();

      // Recreate timer alarm
      if (remaining > 0 && focusState.mode !== 'indefinite') {
        await chrome.alarms.create('focusTimer', {
          delayInMinutes: remaining / 60,
        });
      }
    }
  }
}

initializeState().catch(console.error);

// Log initialization
console.debug('Focus Mode Pro background service worker initialized');

// Track session start
analytics.track('session_start', {
  version: chrome.runtime.getManifest().version,
}).catch(console.error);
