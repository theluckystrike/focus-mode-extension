/**
 * Focus Mode Pro - Feature Registry
 * Defines all features with tier assignments and provides feature gating logic.
 * Integrates with the existing Zovo payment system via ../lib/payments.
 */

import { getTier } from '../lib/payments';

// =============================================================================
// Types
// =============================================================================

export type Tier = 'free' | 'pro';

export interface FeatureLimit {
  count: number;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  tier: Tier;
  limit: FeatureLimit | null; // null = unlimited for that tier
  category: 'core' | 'blocking' | 'timer' | 'analytics' | 'advanced';
}

export const TIERS = { FREE: 'free' as Tier, PRO: 'pro' as Tier };

// =============================================================================
// Feature Definitions
// =============================================================================

export const FEATURES: Record<string, FeatureDefinition> = {
  // ---- FREE features (core value, drives installs) ----
  basic_blocking: {
    id: 'basic_blocking',
    name: 'Block Distracting Sites',
    description: 'Block websites during focus (limit: 7 custom rules)',
    tier: TIERS.FREE,
    limit: { count: 7, period: 'monthly' }, // enforced by rule count in storage, not daily usage
    category: 'blocking',
  },
  category_social: {
    id: 'category_social',
    name: 'Social Media Blocking',
    description: 'Block social media category',
    tier: TIERS.FREE,
    limit: null,
    category: 'blocking',
  },
  pomodoro_basic: {
    id: 'pomodoro_basic',
    name: 'Pomodoro Timer',
    description: 'Standard 25/5 Pomodoro timer',
    tier: TIERS.FREE,
    limit: null,
    category: 'timer',
  },
  basic_stats: {
    id: 'basic_stats',
    name: 'Daily Focus Stats',
    description: "View today's focus time and sessions",
    tier: TIERS.FREE,
    limit: null,
    category: 'analytics',
  },
  focus_sessions: {
    id: 'focus_sessions',
    name: 'Focus Sessions',
    description: 'Start focus sessions',
    tier: TIERS.FREE,
    limit: { count: 8, period: 'daily' },
    category: 'core',
  },
  emergency_unlock: {
    id: 'emergency_unlock',
    name: 'Emergency Unlock',
    description: 'Unlock blocked sites in emergency',
    tier: TIERS.FREE,
    limit: { count: 2, period: 'daily' },
    category: 'core',
  },

  // ---- PRO features (drives upgrades) ----
  unlimited_rules: {
    id: 'unlimited_rules',
    name: 'Unlimited Block Rules',
    description: 'No limit on custom block rules',
    tier: TIERS.PRO,
    limit: null,
    category: 'blocking',
  },
  all_categories: {
    id: 'all_categories',
    name: 'All Category Presets',
    description: 'Access News, Entertainment, Shopping, Gaming categories',
    tier: TIERS.PRO,
    limit: null,
    category: 'blocking',
  },
  regex_patterns: {
    id: 'regex_patterns',
    name: 'Regex Patterns',
    description: 'Use regex for advanced blocking patterns',
    tier: TIERS.PRO,
    limit: null,
    category: 'blocking',
  },
  custom_timer: {
    id: 'custom_timer',
    name: 'Custom Focus Durations',
    description: 'Set any focus/break duration',
    tier: TIERS.PRO,
    limit: null,
    category: 'timer',
  },
  schedule_mode: {
    id: 'schedule_mode',
    name: 'Schedule Mode',
    description: 'Auto-start focus on a schedule',
    tier: TIERS.PRO,
    limit: null,
    category: 'timer',
  },
  password_protection: {
    id: 'password_protection',
    name: 'Password Lock',
    description: 'Password protect focus sessions',
    tier: TIERS.PRO,
    limit: null,
    category: 'advanced',
  },
  advanced_stats: {
    id: 'advanced_stats',
    name: 'Advanced Analytics',
    description: 'Weekly/monthly trends, detailed history',
    tier: TIERS.PRO,
    limit: null,
    category: 'analytics',
  },
  whitelist_rules: {
    id: 'whitelist_rules',
    name: 'Whitelist Rules',
    description: 'Allow specific sites during focus',
    tier: TIERS.PRO,
    limit: null,
    category: 'blocking',
  },
  export_data: {
    id: 'export_data',
    name: 'Export Data',
    description: 'Export focus stats as JSON',
    tier: TIERS.PRO,
    limit: null,
    category: 'analytics',
  },
  indefinite_mode: {
    id: 'indefinite_mode',
    name: 'Indefinite Focus',
    description: 'Focus without a timer until manually stopped',
    tier: TIERS.PRO,
    limit: null,
    category: 'timer',
  },
};

// =============================================================================
// FeatureManager Class
// =============================================================================

export class FeatureManager {
  private currentTier: Tier = TIERS.FREE;
  private initialized = false;

  /**
   * Initialize the feature manager by loading the current tier from the
   * existing payment system.
   */
  async init(): Promise<void> {
    await this.refreshTier();
    this.initialized = true;
  }

  /**
   * Get the user's current tier.
   */
  getCurrentTier(): Tier {
    return this.currentTier;
  }

  /**
   * Check whether the user is on the pro tier.
   */
  isPro(): boolean {
    return this.currentTier === TIERS.PRO;
  }

  /**
   * Re-fetch the tier from the payment system. Any Zovo tier that is not
   * literally 'free' (e.g. 'pro', 'lifetime', 'team') maps to our local
   * 'pro' tier since the feature registry only distinguishes free vs pro.
   */
  async refreshTier(): Promise<void> {
    try {
      const paymentTier = await getTier();
      this.currentTier = paymentTier === 'free' ? TIERS.FREE : TIERS.PRO;
    } catch {
      // If we cannot reach the payment system, keep the last known tier
      // (defaults to 'free' if never initialized).
    }
  }

  /**
   * Check whether the current user can use a given feature.
   *
   * Returns availability status, an optional human-readable reason when the
   * feature is unavailable, and the applicable limit (if any).
   */
  checkFeature(featureId: string): {
    available: boolean;
    reason: string | null;
    limit: FeatureLimit | null;
  } {
    const feature = FEATURES[featureId];

    if (!feature) {
      return {
        available: false,
        reason: `Unknown feature: ${featureId}`,
        limit: null,
      };
    }

    // Pro users always have access to every feature with no limits.
    if (this.currentTier === TIERS.PRO) {
      return { available: true, reason: null, limit: null };
    }

    // Free users cannot access pro-only features.
    if (feature.tier === TIERS.PRO) {
      return {
        available: false,
        reason: `${feature.name} requires Focus Mode Pro`,
        limit: null,
      };
    }

    // Free user accessing a free-tier feature — return with limit info.
    return {
      available: true,
      reason: null,
      limit: feature.limit,
    };
  }

  /**
   * Get a single feature definition by id, or null if it does not exist.
   */
  getFeature(featureId: string): FeatureDefinition | null {
    return FEATURES[featureId] ?? null;
  }

  /**
   * Return all features that belong to a given tier.
   */
  getFeaturesByTier(tier: Tier): FeatureDefinition[] {
    return Object.values(FEATURES).filter((f) => f.tier === tier);
  }

  /**
   * Return the full feature map.
   */
  getAllFeatures(): Record<string, FeatureDefinition> {
    return { ...FEATURES };
  }

  /**
   * Build a comparison table suitable for rendering in a free-vs-pro UI.
   */
  getComparisonTable(): Array<{
    id: string;
    name: string;
    description: string;
    freeAccess: string;
    proAccess: string;
  }> {
    return Object.values(FEATURES).map((feature) => {
      let freeAccess: string;
      let proAccess: string;

      if (feature.tier === TIERS.PRO) {
        freeAccess = 'Not available';
        proAccess = 'Unlimited';
      } else if (feature.limit) {
        freeAccess = `${feature.limit.count} per ${feature.limit.period}`;
        proAccess = 'Unlimited';
      } else {
        freeAccess = 'Unlimited';
        proAccess = 'Unlimited';
      }

      return {
        id: feature.id,
        name: feature.name,
        description: feature.description,
        freeAccess,
        proAccess,
      };
    });
  }
}

// =============================================================================
// Singleton
// =============================================================================

export const featureManager = new FeatureManager();
