/**
 * Tests for storage utilities
 */

import {
  get,
  set,
  remove,
  clear,
  getSettings,
  updateSettings,
  addToBlocklist,
  removeFromBlocklist,
  addToWhitelist,
  removeFromWhitelist,
  getStats,
  updateStats,
  calculateProductivityScore,
} from '../storage';
import { DEFAULT_SETTINGS, DEFAULT_USAGE_STATS } from '../types';

describe('Generic storage operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should retrieve value from storage', async () => {
      const mockValue = { test: 'value' };
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({ testKey: mockValue });

      const result = await get<typeof mockValue>('testKey');

      expect(chrome.storage.local.get).toHaveBeenCalledWith('testKey');
      expect(result).toEqual(mockValue);
    });

    it('should return null for non-existent key', async () => {
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await get('nonExistent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (chrome.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await get('testKey');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should save value to storage', async () => {
      (chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      await set('testKey', { test: 'value' });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ testKey: { test: 'value' } });
    });

    it('should throw on error', async () => {
      (chrome.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(set('testKey', 'value')).rejects.toThrow('Storage error');
    });
  });

  describe('remove', () => {
    it('should remove value from storage', async () => {
      (chrome.storage.local.remove as jest.Mock).mockResolvedValue(undefined);

      await remove('testKey');

      expect(chrome.storage.local.remove).toHaveBeenCalledWith('testKey');
    });
  });

  describe('clear', () => {
    it('should clear all storage', async () => {
      (chrome.storage.local.clear as jest.Mock).mockResolvedValue(undefined);

      await clear();

      expect(chrome.storage.local.clear).toHaveBeenCalled();
    });
  });
});

describe('Settings operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return defaults when no settings exist', async () => {
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await getSettings();

      expect(result).toMatchObject(DEFAULT_SETTINGS);
    });

    it('should merge stored settings with defaults', async () => {
      const partialSettings = {
        theme: 'light' as const,
        focusMode: { enabled: true },
      };
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({ settings: partialSettings });

      const result = await getSettings();

      expect(result.theme).toBe('light');
      expect(result.focusMode.enabled).toBe(true);
      // Should still have default values for unset fields
      expect(result.pomodoro).toBeDefined();
    });
  });

  describe('updateSettings', () => {
    it('should update specific settings', async () => {
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({ settings: DEFAULT_SETTINGS });
      (chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const result = await updateSettings({ theme: 'light' });

      expect(result.theme).toBe('light');
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });
});

describe('Blocklist operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({ settings: DEFAULT_SETTINGS });
    (chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined);
  });

  describe('addToBlocklist', () => {
    it('should add a site to blocklist', async () => {
      const rule = await addToBlocklist('facebook.com');

      expect(rule.pattern).toBe('facebook.com');
      expect(rule.isRegex).toBe(false);
      expect(rule.enabled).toBe(true);
      expect(rule.id).toBeTruthy();
    });

    it('should support regex patterns', async () => {
      const rule = await addToBlocklist('.*\\.social\\.com', true);

      expect(rule.pattern).toBe('.*\\.social\\.com');
      expect(rule.isRegex).toBe(true);
    });

    it('should support category assignment', async () => {
      const rule = await addToBlocklist('custom-social.com', false, 'social');

      expect(rule.category).toBe('social');
    });
  });

  describe('removeFromBlocklist', () => {
    it('should remove a site from blocklist', async () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        blocklist: [{ id: 'test-id', pattern: 'facebook.com', isRegex: false, enabled: true, createdAt: Date.now() }],
      };
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({ settings });

      await removeFromBlocklist('test-id');

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });
});

describe('Whitelist operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({ settings: DEFAULT_SETTINGS });
    (chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined);
  });

  describe('addToWhitelist', () => {
    it('should add a site to whitelist', async () => {
      const rule = await addToWhitelist('docs.google.com');

      expect(rule.pattern).toBe('docs.google.com');
      expect(rule.enabled).toBe(true);
    });
  });

  describe('removeFromWhitelist', () => {
    it('should remove a site from whitelist', async () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        whitelist: [{ id: 'test-id', pattern: 'docs.google.com', isRegex: false, enabled: true, createdAt: Date.now() }],
      };
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({ settings });

      await removeFromWhitelist('test-id');

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });
});

describe('Statistics operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return defaults when no stats exist', async () => {
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await getStats();

      expect(result).toMatchObject(DEFAULT_USAGE_STATS);
    });

    it('should return stored stats', async () => {
      const storedStats = {
        ...DEFAULT_USAGE_STATS,
        totalFocusTime: 120,
        totalSessions: 5,
      };
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({ usageStats: storedStats });

      const result = await getStats();

      expect(result.totalFocusTime).toBe(120);
      expect(result.totalSessions).toBe(5);
    });
  });

  describe('updateStats', () => {
    it('should update statistics', async () => {
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({ usageStats: DEFAULT_USAGE_STATS });
      (chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const result = await updateStats({ totalFocusTime: 60 });

      expect(result.totalFocusTime).toBe(60);
    });
  });

  describe('calculateProductivityScore', () => {
    it('should return 0 for no activity', () => {
      const score = calculateProductivityScore(DEFAULT_USAGE_STATS);
      expect(score).toBe(0);
    });

    it('should calculate score based on today stats', () => {
      const today = new Date().toISOString().split('T')[0] ?? '';
      const stats = {
        ...DEFAULT_USAGE_STATS,
        currentStreak: 5,
        dailyStats: [{
          date: today,
          totalFocusTime: 120, // 2 hours
          sessionsCompleted: 4,
          sitesBlocked: 10,
          pomodorosCompleted: 4,
        }],
      };

      const score = calculateProductivityScore(stats);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
