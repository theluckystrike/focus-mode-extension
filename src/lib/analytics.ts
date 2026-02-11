/**
 * Focus Mode Pro - Privacy-First Analytics
 * Tracks usage locally for insights - NO external requests
 * All data stays on device
 */

interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp: number;
}

const MAX_EVENTS = 100;

/**
 * Track an event locally
 */
export async function track(
  eventName: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { analytics = [] } = await chrome.storage.local.get('analytics');

    const events = analytics as AnalyticsEvent[];
    events.push({
      event: eventName,
      properties,
      timestamp: Date.now(),
    });

    // Keep only the last MAX_EVENTS
    while (events.length > MAX_EVENTS) {
      events.shift();
    }

    await chrome.storage.local.set({ analytics: events });
  } catch (e) {
    // Analytics are not critical - fail silently
  }
}

/**
 * Get all tracked events
 */
export async function getEvents(): Promise<AnalyticsEvent[]> {
  try {
    const { analytics = [] } = await chrome.storage.local.get('analytics');
    return analytics as AnalyticsEvent[];
  } catch (e) {
    return [];
  }
}

/**
 * Get usage statistics
 */
export async function getUsageStats(): Promise<{
  total: number;
  today: number;
  thisWeek: number;
}> {
  try {
    const events = await getEvents();
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    return {
      total: events.length,
      today: events.filter((e) => e.timestamp > dayAgo).length,
      thisWeek: events.filter((e) => e.timestamp > weekAgo).length,
    };
  } catch (e) {
    return { total: 0, today: 0, thisWeek: 0 };
  }
}

/**
 * Get days since install
 */
export async function getDaysSinceInstall(): Promise<number> {
  try {
    const { installedAt } = await chrome.storage.local.get('installedAt');
    if (!installedAt) return 0;
    return Math.floor((Date.now() - installedAt) / (24 * 60 * 60 * 1000));
  } catch (e) {
    return 0;
  }
}

/**
 * Clear all analytics data
 */
export async function clearAnalytics(): Promise<void> {
  try {
    await chrome.storage.local.remove('analytics');
  } catch (e) {
    // Fail silently
  }
}

export const analytics = {
  track,
  getEvents,
  getUsageStats,
  getDaysSinceInstall,
  clearAnalytics,
};

export default analytics;
