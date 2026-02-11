/**
 * Tests for analytics utilities
 */

import { track, getEvents, getUsageStats, getDaysSinceInstall, clearAnalytics } from '../analytics';

describe('Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({});
    (chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined);
    (chrome.storage.local.remove as jest.Mock).mockResolvedValue(undefined);
  });

  describe('track', () => {
    it('should track an event', async () => {
      await track('test_event', { foo: 'bar' });

      expect(chrome.storage.local.set).toHaveBeenCalled();
      const setCall = (chrome.storage.local.set as jest.Mock).mock.calls[0]?.[0];
      expect(setCall?.analytics).toBeDefined();
      expect(setCall?.analytics[0]?.event).toBe('test_event');
      expect(setCall?.analytics[0]?.properties).toEqual({ foo: 'bar' });
    });

    it('should append to existing events', async () => {
      const existingEvents = [
        { event: 'existing', properties: {}, timestamp: Date.now() - 1000 },
      ];
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({ analytics: existingEvents });

      await track('new_event');

      const setCall = (chrome.storage.local.set as jest.Mock).mock.calls[0]?.[0];
      expect(setCall?.analytics.length).toBe(2);
    });

    it('should limit events to 100', async () => {
      const manyEvents = Array(100).fill(null).map((_, i) => ({
        event: `event_${i}`,
        properties: {},
        timestamp: Date.now(),
      }));
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({ analytics: manyEvents });

      await track('new_event');

      const setCall = (chrome.storage.local.set as jest.Mock).mock.calls[0]?.[0];
      expect(setCall?.analytics.length).toBe(100);
      expect(setCall?.analytics[99]?.event).toBe('new_event');
    });

    it('should handle storage errors gracefully', async () => {
      (chrome.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(track('test_event')).resolves.toBeUndefined();
    });
  });

  describe('getEvents', () => {
    it('should return empty array when no events exist', async () => {
      const result = await getEvents();
      expect(result).toEqual([]);
    });

    it('should return stored events', async () => {
      const events = [
        { event: 'test', properties: {}, timestamp: Date.now() },
      ];
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({ analytics: events });

      const result = await getEvents();

      expect(result).toEqual(events);
    });

    it('should handle errors gracefully', async () => {
      (chrome.storage.local.get as jest.Mock).mockRejectedValue(new Error('Error'));

      const result = await getEvents();

      expect(result).toEqual([]);
    });
  });

  describe('getUsageStats', () => {
    it('should return zeros when no events exist', async () => {
      const result = await getUsageStats();

      expect(result).toEqual({ total: 0, today: 0, thisWeek: 0 });
    });

    it('should calculate stats correctly', async () => {
      const now = Date.now();
      const events = [
        { event: 'old', properties: {}, timestamp: now - 10 * 24 * 60 * 60 * 1000 }, // 10 days ago
        { event: 'week', properties: {}, timestamp: now - 3 * 24 * 60 * 60 * 1000 }, // 3 days ago
        { event: 'today', properties: {}, timestamp: now - 60 * 60 * 1000 }, // 1 hour ago
      ];
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({ analytics: events });

      const result = await getUsageStats();

      expect(result.total).toBe(3);
      expect(result.today).toBe(1);
      expect(result.thisWeek).toBe(2);
    });
  });

  describe('getDaysSinceInstall', () => {
    it('should return 0 when not installed', async () => {
      const result = await getDaysSinceInstall();
      expect(result).toBe(0);
    });

    it('should calculate days since install', async () => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({ installedAt: threeDaysAgo });

      const result = await getDaysSinceInstall();

      expect(result).toBe(3);
    });
  });

  describe('clearAnalytics', () => {
    it('should remove analytics from storage', async () => {
      await clearAnalytics();

      expect(chrome.storage.local.remove).toHaveBeenCalledWith('analytics');
    });

    it('should handle errors gracefully', async () => {
      (chrome.storage.local.remove as jest.Mock).mockRejectedValue(new Error('Error'));

      // Should not throw
      await expect(clearAnalytics()).resolves.toBeUndefined();
    });
  });
});
