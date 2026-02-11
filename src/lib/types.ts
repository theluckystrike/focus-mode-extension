/**
 * Focus Mode Pro - TypeScript Type Definitions
 * Core interfaces and types for the extension
 */

// ============================================================================
// Focus Mode Types
// ============================================================================

/** Focus mode status */
export type FocusStatus = 'idle' | 'focusing' | 'break' | 'paused';

/** Timer mode */
export type TimerMode = 'pomodoro' | 'custom' | 'indefinite';

/** Block rule type */
export interface BlockRule {
  id: string;
  pattern: string;
  isRegex: boolean;
  enabled: boolean;
  category?: string;
  createdAt: number;
}

/** Whitelist rule */
export interface WhitelistRule {
  id: string;
  pattern: string;
  isRegex: boolean;
  enabled: boolean;
  createdAt: number;
}

/** Schedule configuration */
export interface ScheduleConfig {
  enabled: boolean;
  days: number[]; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

/** Pomodoro configuration */
export interface PomodoroConfig {
  focusDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

/** Focus session data */
export interface FocusSession {
  id: string;
  startTime: number;
  endTime?: number;
  mode: TimerMode;
  targetDuration: number; // minutes
  actualDuration?: number; // minutes
  sitesBlocked: number;
  completed: boolean;
}

/** Daily statistics */
export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalFocusTime: number; // minutes
  sessionsCompleted: number;
  sitesBlocked: number;
  pomodorosCompleted: number;
}

/** Category preset */
export interface CategoryPreset {
  id: string;
  name: string;
  icon: string;
  patterns: string[];
  enabled: boolean;
}

// ============================================================================
// Settings Types
// ============================================================================

/** Extension settings */
export interface Settings {
  theme: 'light' | 'dark' | 'system';

  // Focus Mode
  focusMode: {
    enabled: boolean;
    status: FocusStatus;
    timerMode: TimerMode;
    currentSessionStart?: number;
    currentBreakStart?: number;
    pomodoroCount: number;
    customDuration: number; // minutes
    pausedAt?: number;
    pausedDuration?: number;
    currentSessionId?: string;
    sitesBlockedThisSession?: number;
  };

  // Blocking
  blocklist: BlockRule[];
  whitelist: WhitelistRule[];
  categories: CategoryPreset[];

  // Pomodoro
  pomodoro: PomodoroConfig;

  // Schedule
  schedule: ScheduleConfig;

  // Break Reminders
  breakReminders: {
    enabled: boolean;
    intervalMinutes: number;
    showNotification: boolean;
  };

  // Password Protection
  passwordProtection: {
    enabled: boolean;
    passwordHash?: string;
    cooldownMinutes: number;
    lastUnlockAttempt?: number;
  };

  // Blocked Page
  blockedPage: {
    showTimer: boolean;
    showQuote: boolean;
    allowEmergencyUnlock: boolean;
    emergencyCooldownMinutes: number;
    lastEmergencyUnlockTime?: number;
  };

  // Notifications
  notifications: {
    sessionComplete: boolean;
    breakComplete: boolean;
    breakReminder: boolean;
    dailySummary: boolean;
  };

  // Sound
  sound: {
    enabled: boolean;
    volume: number; // 0-100
  };
}

/** Usage statistics */
export interface UsageStats {
  totalFocusTime: number; // minutes
  totalSessions: number;
  totalSitesBlocked: number;
  totalPomodorosCompleted: number;
  currentStreak: number; // days
  longestStreak: number; // days
  lastSessionDate?: string;
  dailyStats: DailyStats[];
  sessions: FocusSession[];
}

/** Complete storage data structure */
export interface StorageData {
  settings: Settings;
  usageStats: UsageStats;
  onboardingComplete: boolean;
  installedAt: number;
}

// ============================================================================
// Messaging Types
// ============================================================================

/** Message actions for inter-script communication */
export type MessageAction =
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'GET_STATS'
  | 'TRACK_ACTION'
  | 'PING'
  | 'START_FOCUS'
  | 'STOP_FOCUS'
  | 'PAUSE_FOCUS'
  | 'RESUME_FOCUS'
  | 'START_BREAK'
  | 'END_BREAK'
  | 'SKIP_BREAK'
  | 'GET_FOCUS_STATE'
  | 'CHECK_URL'
  | 'ADD_TO_BLOCKLIST'
  | 'REMOVE_FROM_BLOCKLIST'
  | 'ADD_TO_WHITELIST'
  | 'REMOVE_FROM_WHITELIST'
  | 'EMERGENCY_UNLOCK'
  | 'VERIFY_PASSWORD'
  | 'GET_TIMER_STATE'
  | 'GET_QUOTE';

/** Base message structure */
export interface Message<T = unknown> {
  action: MessageAction;
  payload?: T;
}

/** Generic message response */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Timer state for communication */
export interface TimerState {
  status: FocusStatus;
  mode: TimerMode;
  remainingSeconds: number;
  totalSeconds: number;
  pomodoroCount: number;
  sessionsUntilLongBreak: number;
}

/** URL check result */
export interface UrlCheckResult {
  blocked: boolean;
  reason?: string;
  matchedRule?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Storage keys for chrome.storage */
export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  USAGE_STATS: 'usageStats',
  ONBOARDING_COMPLETE: 'onboardingComplete',
  INSTALLED_AT: 'installedAt',
} as const;

/** Default category presets */
export const DEFAULT_CATEGORIES: CategoryPreset[] = [
  {
    id: 'social',
    name: 'Social Media',
    icon: '💬',
    patterns: [
      'facebook.com',
      'twitter.com',
      'x.com',
      'instagram.com',
      'tiktok.com',
      'snapchat.com',
      'linkedin.com/feed',
      'reddit.com',
      'threads.net',
    ],
    enabled: true,
  },
  {
    id: 'news',
    name: 'News Sites',
    icon: '📰',
    patterns: [
      'cnn.com',
      'bbc.com',
      'nytimes.com',
      'foxnews.com',
      'news.google.com',
      'huffpost.com',
      'buzzfeed.com',
    ],
    enabled: false,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: '🎬',
    patterns: [
      'youtube.com',
      'netflix.com',
      'hulu.com',
      'disneyplus.com',
      'twitch.tv',
      'primevideo.com',
      'hbomax.com',
    ],
    enabled: false,
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛒',
    patterns: [
      'amazon.com',
      'ebay.com',
      'etsy.com',
      'walmart.com',
      'target.com',
      'aliexpress.com',
    ],
    enabled: false,
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    patterns: [
      'steampowered.com',
      'epicgames.com',
      'roblox.com',
      'discord.com',
      'itch.io',
    ],
    enabled: false,
  },
];

/** Default Pomodoro settings */
export const DEFAULT_POMODORO: PomodoroConfig = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
};

/** Default extension settings */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',

  focusMode: {
    enabled: false,
    status: 'idle',
    timerMode: 'pomodoro',
    pomodoroCount: 0,
    customDuration: 60,
  },

  blocklist: [],
  whitelist: [],
  categories: DEFAULT_CATEGORIES,

  pomodoro: DEFAULT_POMODORO,

  schedule: {
    enabled: false,
    days: [1, 2, 3, 4, 5], // Monday to Friday
    startTime: '09:00',
    endTime: '17:00',
  },

  breakReminders: {
    enabled: true,
    intervalMinutes: 30,
    showNotification: true,
  },

  passwordProtection: {
    enabled: false,
    cooldownMinutes: 5,
  },

  blockedPage: {
    showTimer: true,
    showQuote: true,
    allowEmergencyUnlock: true,
    emergencyCooldownMinutes: 15,
  },

  notifications: {
    sessionComplete: true,
    breakComplete: true,
    breakReminder: true,
    dailySummary: false,
  },

  sound: {
    enabled: true,
    volume: 50,
  },
};

/** Default usage statistics */
export const DEFAULT_USAGE_STATS: UsageStats = {
  totalFocusTime: 0,
  totalSessions: 0,
  totalSitesBlocked: 0,
  totalPomodorosCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  dailyStats: [],
  sessions: [],
};

// ============================================================================
// Motivational Quotes
// ============================================================================

export const MOTIVATIONAL_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "It's not about having time, it's about making time.", author: "Unknown" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Productivity is never an accident. It is always the result of commitment to excellence.", author: "Paul J. Meyer" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Your focus determines your reality.", author: "Qui-Gon Jinn" },
  { text: "Starve your distractions, feed your focus.", author: "Unknown" },
  { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
  { text: "Lack of direction, not lack of time, is the problem.", author: "Zig Ziglar" },
  { text: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie" },
  { text: "You will never find time for anything. If you want time, you must make it.", author: "Charles Buxton" },
  { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format minutes to human readable string
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Check if URL matches a pattern
 */
export function urlMatchesPattern(url: string, pattern: string, isRegex: boolean): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    const fullUrl = hostname + urlObj.pathname;

    if (isRegex) {
      const regex = new RegExp(pattern, 'i');
      return regex.test(fullUrl) || regex.test(hostname);
    } else {
      const normalizedPattern = pattern.replace(/^www\./, '').toLowerCase();
      const lowerHostname = hostname.toLowerCase();
      const lowerFullUrl = fullUrl.toLowerCase();

      // Handle wildcard patterns like "*.reddit.com"
      if (normalizedPattern.startsWith('*.')) {
        const baseDomain = normalizedPattern.slice(2);
        return lowerHostname === baseDomain ||
               lowerHostname.endsWith('.' + baseDomain);
      }

      // Domain-boundary matching: exact match or subdomain match
      const domainMatches = lowerHostname === normalizedPattern ||
                            lowerHostname.endsWith('.' + normalizedPattern);

      if (!domainMatches) {
        return false;
      }

      // If pattern includes a path component, check that too
      if (normalizedPattern.includes('/')) {
        return lowerFullUrl.startsWith(normalizedPattern) ||
               lowerFullUrl.includes('.' + normalizedPattern);
      }

      return true;
    }
  } catch {
    return false;
  }
}

/**
 * Get today's date string
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

/**
 * PBKDF2 password hashing
 */
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 256;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.includes(':')) {
    return false; // Legacy SHA-256 hash, force reset
  }
  const [saltHex, expectedHashHex] = storedHash.split(':');
  if (!saltHex || !expectedHashHex) return false;
  const saltMatches = saltHex.match(/.{1,2}/g);
  if (!saltMatches) return false;
  const salt = new Uint8Array(saltMatches.map(byte => parseInt(byte, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH
  );
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === expectedHashHex;
}
