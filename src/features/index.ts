/**
 * Focus Mode Pro - Features Barrel Export
 * Re-exports everything from feature-registry and usage-tracker.
 */

export { featureManager, FeatureManager, FEATURES, TIERS } from './feature-registry';
export type { FeatureDefinition, FeatureLimit, Tier } from './feature-registry';
export { usageTracker, UsageTracker } from './usage-tracker';
export type { UsageResult, UsageData } from './usage-tracker';
