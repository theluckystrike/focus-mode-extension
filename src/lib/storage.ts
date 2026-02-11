/**
 * Focus Mode Pro - Storage Utilities
 * Chrome storage operations with TypeScript support
 */

import {
  Settings,
  UsageStats,
  FocusSession,
  DailyStats,
  BlockRule,
  WhitelistRule,
  DEFAULT_SETTINGS,
  DEFAULT_USAGE_STATS,
  STORAGE_KEYS,
  getTodayString,
  generateId,
} from './types';

// ============================================================================
// Generic Storage Operations
// ============================================================================

/**
 * Get a value from chrome.storage.local
 */
export async function get<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T) ?? null;
  } catch (e) {
    console.error(`Storage get error for ${key}:`, e);
    return null;
  }
}

/**
 * Set a value in chrome.storage.local
 */
export async function set<T>(key: string, value: T): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (e) {
    console.error(`Storage set error for ${key}:`, e);
    throw e;
  }
}

/**
 * Remove a value from chrome.storage.local
 */
export async function remove(key: string): Promise<void> {
  try {
    await chrome.storage.local.remove(key);
  } catch (e) {
    console.error(`Storage remove error for ${key}:`, e);
    throw e;
  }
}

/**
 * Clear all storage
 */
export async function clear(): Promise<void> {
  try {
    await chrome.storage.local.clear();
  } catch (e) {
    console.error('Storage clear error:', e);
    throw e;
  }
}

// ============================================================================
// Settings Operations
// ============================================================================

/**
 * Get extension settings
 */
export async function getSettings(): Promise<Settings> {
  const settings = await get<Settings>(STORAGE_KEYS.SETTINGS);
  if (!settings) {
    return { ...DEFAULT_SETTINGS };
  }
  // Merge with defaults to ensure all fields exist
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    focusMode: { ...DEFAULT_SETTINGS.focusMode, ...settings.focusMode },
    pomodoro: { ...DEFAULT_SETTINGS.pomodoro, ...settings.pomodoro },
    schedule: { ...DEFAULT_SETTINGS.schedule, ...settings.schedule },
    breakReminders: { ...DEFAULT_SETTINGS.breakReminders, ...settings.breakReminders },
    passwordProtection: { ...DEFAULT_SETTINGS.passwordProtection, ...settings.passwordProtection },
    blockedPage: { ...DEFAULT_SETTINGS.blockedPage, ...settings.blockedPage },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...settings.notifications },
    sound: { ...DEFAULT_SETTINGS.sound, ...settings.sound },
  };
}

/**
 * Update extension settings
 */
export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const updated = { ...current, ...updates };
  await set(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<Settings> {
  await set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

// ============================================================================
// Blocklist Operations
// ============================================================================

/**
 * Add a site to the blocklist
 */
export async function addToBlocklist(pattern: string, isRegex = false, category?: string): Promise<BlockRule> {
  const settings = await getSettings();
  const rule: BlockRule = {
    id: generateId(),
    pattern,
    isRegex,
    enabled: true,
    category,
    createdAt: Date.now(),
  };
  settings.blocklist.push(rule);
  await updateSettings({ blocklist: settings.blocklist });
  return rule;
}

/**
 * Remove a site from the blocklist
 */
export async function removeFromBlocklist(id: string): Promise<void> {
  const settings = await getSettings();
  settings.blocklist = settings.blocklist.filter(rule => rule.id !== id);
  await updateSettings({ blocklist: settings.blocklist });
}

/**
 * Toggle a blocklist rule
 */
export async function toggleBlocklistRule(id: string): Promise<void> {
  const settings = await getSettings();
  const rule = settings.blocklist.find(r => r.id === id);
  if (rule) {
    rule.enabled = !rule.enabled;
    await updateSettings({ blocklist: settings.blocklist });
  }
}

// ============================================================================
// Whitelist Operations
// ============================================================================

/**
 * Add a site to the whitelist
 */
export async function addToWhitelist(pattern: string, isRegex = false): Promise<WhitelistRule> {
  const settings = await getSettings();
  const rule: WhitelistRule = {
    id: generateId(),
    pattern,
    isRegex,
    enabled: true,
    createdAt: Date.now(),
  };
  settings.whitelist.push(rule);
  await updateSettings({ whitelist: settings.whitelist });
  return rule;
}

/**
 * Remove a site from the whitelist
 */
export async function removeFromWhitelist(id: string): Promise<void> {
  const settings = await getSettings();
  settings.whitelist = settings.whitelist.filter(rule => rule.id !== id);
  await updateSettings({ whitelist: settings.whitelist });
}

// ============================================================================
// Category Operations
// ============================================================================

/**
 * Toggle a category
 */
export async function toggleCategory(categoryId: string): Promise<void> {
  const settings = await getSettings();
  const category = settings.categories.find(c => c.id === categoryId);
  if (category) {
    category.enabled = !category.enabled;
    await updateSettings({ categories: settings.categories });
  }
}

// ============================================================================
// Usage Statistics
// ============================================================================

/**
 * Get usage statistics
 */
export async function getStats(): Promise<UsageStats> {
  const stats = await get<UsageStats>(STORAGE_KEYS.USAGE_STATS);
  return stats ?? { ...DEFAULT_USAGE_STATS };
}

/**
 * Update usage statistics
 */
export async function updateStats(updates: Partial<UsageStats>): Promise<UsageStats> {
  const current = await getStats();
  const updated = { ...current, ...updates };
  await set(STORAGE_KEYS.USAGE_STATS, updated);
  return updated;
}

/**
 * Record a completed focus session
 */
export async function recordSession(session: FocusSession): Promise<void> {
  const stats = await getStats();
  const today = getTodayString();

  // Add session to history
  stats.sessions.unshift(session);
  // Keep only last 100 sessions
  if (stats.sessions.length > 100) {
    stats.sessions = stats.sessions.slice(0, 100);
  }

  // Update totals
  stats.totalSessions++;
  if (session.actualDuration) {
    stats.totalFocusTime += session.actualDuration;
  }
  stats.totalSitesBlocked += session.sitesBlocked;

  // Update daily stats
  let todayStats = stats.dailyStats.find(d => d.date === today);
  if (!todayStats) {
    todayStats = {
      date: today,
      totalFocusTime: 0,
      sessionsCompleted: 0,
      sitesBlocked: 0,
      pomodorosCompleted: 0,
    };
    stats.dailyStats.unshift(todayStats);
  }

  if (session.actualDuration) {
    todayStats.totalFocusTime += session.actualDuration;
  }
  if (session.completed) {
    todayStats.sessionsCompleted++;
    if (session.mode === 'pomodoro') {
      todayStats.pomodorosCompleted++;
      stats.totalPomodorosCompleted++;
    }
  }
  todayStats.sitesBlocked += session.sitesBlocked;

  // Update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0] ?? '';

  if (stats.lastSessionDate === yesterdayString || stats.lastSessionDate === today) {
    if (stats.lastSessionDate !== today) {
      stats.currentStreak++;
    }
  } else if (stats.lastSessionDate !== today) {
    stats.currentStreak = 1;
  }

  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak;
  }

  stats.lastSessionDate = today;

  // Keep only last 30 days of daily stats
  stats.dailyStats = stats.dailyStats.slice(0, 30);

  await updateStats(stats);
}

/**
 * Increment sites blocked counter
 */
export async function incrementSitesBlocked(): Promise<void> {
  const stats = await getStats();
  stats.totalSitesBlocked++;

  const today = getTodayString();
  let todayStats = stats.dailyStats.find(d => d.date === today);
  if (!todayStats) {
    todayStats = {
      date: today,
      totalFocusTime: 0,
      sessionsCompleted: 0,
      sitesBlocked: 0,
      pomodorosCompleted: 0,
    };
    stats.dailyStats.unshift(todayStats);
  }
  todayStats.sitesBlocked++;

  await updateStats(stats);
}

/**
 * Get productivity score (0-100)
 */
export function calculateProductivityScore(stats: UsageStats): number {
  const today = getTodayString();
  const todayStats = stats.dailyStats.find(d => d.date === today);

  if (!todayStats) return 0;

  // Score based on focus time (max 4 hours = 100 points)
  const focusScore = Math.min(todayStats.totalFocusTime / 240, 1) * 40;

  // Score based on sessions completed (max 8 sessions = 100 points)
  const sessionScore = Math.min(todayStats.sessionsCompleted / 8, 1) * 30;

  // Score based on streak (max 30 days = 100 points)
  const streakScore = Math.min(stats.currentStreak / 30, 1) * 30;

  return Math.round(focusScore + sessionScore + streakScore);
}

// ============================================================================
// Installation & Onboarding
// ============================================================================

/**
 * Set installation timestamp
 */
export async function setInstalledAt(): Promise<void> {
  const existing = await get<number>(STORAGE_KEYS.INSTALLED_AT);
  if (!existing) {
    await set(STORAGE_KEYS.INSTALLED_AT, Date.now());
  }
}

/**
 * Get installation timestamp
 */
export async function getInstalledAt(): Promise<number | null> {
  return get<number>(STORAGE_KEYS.INSTALLED_AT);
}

/**
 * Check if onboarding is complete
 */
export async function isOnboardingComplete(): Promise<boolean> {
  const complete = await get<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETE);
  return complete ?? false;
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(): Promise<void> {
  await set(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
}

// ============================================================================
// Export Storage Object
// ============================================================================

export const storage = {
  // Generic
  get,
  set,
  remove,
  clear,

  // Settings
  getSettings,
  updateSettings,
  resetSettings,

  // Blocklist
  addToBlocklist,
  removeFromBlocklist,
  toggleBlocklistRule,

  // Whitelist
  addToWhitelist,
  removeFromWhitelist,

  // Categories
  toggleCategory,

  // Statistics
  getStats,
  updateStats,
  recordSession,
  incrementSitesBlocked,
  calculateProductivityScore,

  // Installation
  setInstalledAt,
  getInstalledAt,
  isOnboardingComplete,
  completeOnboarding,
};

export default storage;
