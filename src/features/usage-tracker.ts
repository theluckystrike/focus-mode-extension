/**
 * Focus Mode Pro - Usage Tracker
 * Tracks per-feature usage counts with automatic daily/weekly/monthly resets.
 * Enforces free-tier limits defined in LIMITS_CONFIG.
 */

import type { Tier } from './feature-registry';

// =============================================================================
// Types
// =============================================================================

export interface UsageResult {
  allowed: boolean;
  remaining: {
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
  };
  reason: string | null;
}

export interface UsageData {
  daily: { count: number; resetAt: string };
  weekly: { count: number; resetAt: string };
  monthly: { count: number; resetAt: string };
  total: number;
  lastUsed: string | null;
}

interface PeriodLimits {
  daily: number | null;   // null = unlimited
  weekly: number | null;
  monthly: number | null;
}

interface TierLimits {
  free: PeriodLimits;
  pro: PeriodLimits;
}

// =============================================================================
// Limits Configuration
// =============================================================================

/**
 * Defines the usage limits for each feature, per tier.
 * null means unlimited for that period.
 * A value of 0 means the feature is completely blocked for that tier
 * (used for pro-only features on the free tier).
 */
const LIMITS_CONFIG: Record<string, TierLimits> = {
  // ---- FREE features ----
  basic_blocking: {
    free: { daily: null, weekly: null, monthly: null }, // enforced by rule count, not usage
    pro: { daily: null, weekly: null, monthly: null },
  },
  category_social: {
    free: { daily: null, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
  pomodoro_basic: {
    free: { daily: null, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
  basic_stats: {
    free: { daily: null, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
  focus_sessions: {
    free: { daily: 8, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
  emergency_unlock: {
    free: { daily: 2, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },

  // ---- PRO-only features ----
  unlimited_rules: {
    free: { daily: 0, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
  all_categories: {
    free: { daily: 0, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
  regex_patterns: {
    free: { daily: 0, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
  custom_timer: {
    free: { daily: 0, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
  schedule_mode: {
    free: { daily: 0, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
  password_protection: {
    free: { daily: 0, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
  advanced_stats: {
    free: { daily: 0, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
  whitelist_rules: {
    free: { daily: 0, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
  export_data: {
    free: { daily: 0, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
  indefinite_mode: {
    free: { daily: 0, weekly: null, monthly: null },
    pro: { daily: null, weekly: null, monthly: null },
  },
};

// =============================================================================
// Storage Key
// =============================================================================

const STORAGE_KEY = 'featureUsage';

// =============================================================================
// Helpers
// =============================================================================

function getStartOfDay(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getStartOfWeek(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getStartOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getNextDayReset(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getNextWeekReset(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 1 : 8); // Next Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getNextMonthReset(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function createEmptyUsageData(): UsageData {
  return {
    daily: { count: 0, resetAt: getNextDayReset() },
    weekly: { count: 0, resetAt: getNextWeekReset() },
    monthly: { count: 0, resetAt: getNextMonthReset() },
    total: 0,
    lastUsed: null,
  };
}

function isPeriodExpired(resetAt: string): boolean {
  return new Date(resetAt).getTime() <= Date.now();
}

// =============================================================================
// UsageTracker Class
// =============================================================================

export class UsageTracker {
  private usageMap: Record<string, UsageData> = {};
  private initialized = false;

  /**
   * Load persisted usage data from chrome.storage.local and reset any
   * expired periods.
   */
  async init(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const stored = result[STORAGE_KEY] as Record<string, UsageData> | undefined;
      this.usageMap = stored ?? {};
    } catch {
      this.usageMap = {};
    }

    // Reset expired periods for every tracked feature.
    let dirty = false;
    for (const featureId of Object.keys(this.usageMap)) {
      const data = this.usageMap[featureId];
      if (!data) continue;
      if (isPeriodExpired(data.daily.resetAt)) {
        data.daily = { count: 0, resetAt: getNextDayReset() };
        dirty = true;
      }
      if (isPeriodExpired(data.weekly.resetAt)) {
        data.weekly = { count: 0, resetAt: getNextWeekReset() };
        dirty = true;
      }
      if (isPeriodExpired(data.monthly.resetAt)) {
        data.monthly = { count: 0, resetAt: getNextMonthReset() };
        dirty = true;
      }
    }

    if (dirty) {
      await this.persist();
    }

    this.initialized = true;
  }

  /**
   * Record a usage of a feature. Checks the limit first and only records
   * if the action is allowed.
   */
  async recordUsage(featureId: string, tier: Tier): Promise<UsageResult> {
    const check = await this.checkLimit(featureId, tier);
    if (!check.allowed) {
      return check;
    }

    // Ensure we have a data entry.
    if (!this.usageMap[featureId]) {
      this.usageMap[featureId] = createEmptyUsageData();
    }

    const data = this.usageMap[featureId]!;

    // Reset expired periods before recording.
    if (isPeriodExpired(data.daily.resetAt)) {
      data.daily = { count: 0, resetAt: getNextDayReset() };
    }
    if (isPeriodExpired(data.weekly.resetAt)) {
      data.weekly = { count: 0, resetAt: getNextWeekReset() };
    }
    if (isPeriodExpired(data.monthly.resetAt)) {
      data.monthly = { count: 0, resetAt: getNextMonthReset() };
    }

    data.daily.count++;
    data.weekly.count++;
    data.monthly.count++;
    data.total++;
    data.lastUsed = new Date().toISOString();

    await this.persist();

    // Recalculate remaining after increment.
    return this.buildResult(featureId, tier, true);
  }

  /**
   * Check whether a feature usage is within limits without recording it.
   */
  async checkLimit(featureId: string, tier: Tier): Promise<UsageResult> {
    const config = LIMITS_CONFIG[featureId];

    // If no config exists for this feature, allow by default (no limits).
    if (!config) {
      return {
        allowed: true,
        remaining: { daily: null, weekly: null, monthly: null },
        reason: null,
      };
    }

    const limits = config[tier];

    // Ensure data entry exists with fresh periods.
    if (!this.usageMap[featureId]) {
      this.usageMap[featureId] = createEmptyUsageData();
    }

    const data = this.usageMap[featureId]!;

    // Reset expired periods before checking.
    let dirty = false;
    if (isPeriodExpired(data.daily.resetAt)) {
      data.daily = { count: 0, resetAt: getNextDayReset() };
      dirty = true;
    }
    if (isPeriodExpired(data.weekly.resetAt)) {
      data.weekly = { count: 0, resetAt: getNextWeekReset() };
      dirty = true;
    }
    if (isPeriodExpired(data.monthly.resetAt)) {
      data.monthly = { count: 0, resetAt: getNextMonthReset() };
      dirty = true;
    }
    if (dirty) {
      await this.persist();
    }

    // Check daily limit.
    if (limits.daily !== null && data.daily.count >= limits.daily) {
      const remaining = this.computeRemaining(data, limits);
      const reason =
        limits.daily === 0
          ? `This feature requires Focus Mode Pro`
          : `Daily limit reached (${limits.daily} per day). Upgrade to Pro for unlimited access.`;
      return { allowed: false, remaining, reason };
    }

    // Check weekly limit.
    if (limits.weekly !== null && data.weekly.count >= limits.weekly) {
      const remaining = this.computeRemaining(data, limits);
      return {
        allowed: false,
        remaining,
        reason: `Weekly limit reached (${limits.weekly} per week). Upgrade to Pro for unlimited access.`,
      };
    }

    // Check monthly limit.
    if (limits.monthly !== null && data.monthly.count >= limits.monthly) {
      const remaining = this.computeRemaining(data, limits);
      return {
        allowed: false,
        remaining,
        reason: `Monthly limit reached (${limits.monthly} per month). Upgrade to Pro for unlimited access.`,
      };
    }

    return this.buildResult(featureId, tier, true);
  }

  /**
   * Get raw usage data for a single feature.
   */
  getUsage(featureId: string): UsageData {
    return this.usageMap[featureId] ?? createEmptyUsageData();
  }

  /**
   * Get all raw usage data.
   */
  getAllUsage(): Record<string, UsageData> {
    return { ...this.usageMap };
  }

  /**
   * Get the sum of all total action counts across every tracked feature.
   */
  getTotalActions(): number {
    let sum = 0;
    for (const featureId of Object.keys(this.usageMap)) {
      const data = this.usageMap[featureId];
      if (data) {
        sum += data.total;
      }
    }
    return sum;
  }

  /**
   * Reset all tracked usage data.
   */
  async resetAll(): Promise<void> {
    this.usageMap = {};
    await this.persist();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async persist(): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: this.usageMap });
    } catch {
      console.warn('[UsageTracker] Failed to persist usage data');
    }
  }

  private computeRemaining(
    data: UsageData,
    limits: PeriodLimits
  ): { daily: number | null; weekly: number | null; monthly: number | null } {
    return {
      daily:
        limits.daily !== null ? Math.max(0, limits.daily - data.daily.count) : null,
      weekly:
        limits.weekly !== null
          ? Math.max(0, limits.weekly - data.weekly.count)
          : null,
      monthly:
        limits.monthly !== null
          ? Math.max(0, limits.monthly - data.monthly.count)
          : null,
    };
  }

  private buildResult(
    featureId: string,
    tier: Tier,
    allowed: boolean
  ): UsageResult {
    const config = LIMITS_CONFIG[featureId];
    const data = this.usageMap[featureId] ?? createEmptyUsageData();

    if (!config) {
      return {
        allowed,
        remaining: { daily: null, weekly: null, monthly: null },
        reason: null,
      };
    }

    const limits = config[tier];
    return {
      allowed,
      remaining: this.computeRemaining(data, limits),
      reason: null,
    };
  }
}

// =============================================================================
// Singleton
// =============================================================================

export const usageTracker = new UsageTracker();
