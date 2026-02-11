/**
 * Tests for type utilities and constants
 */

import {
  generateId,
  formatTime,
  formatMinutes,
  urlMatchesPattern,
  getTodayString,
  hashPassword,
  verifyPassword,
  DEFAULT_SETTINGS,
  DEFAULT_USAGE_STATS,
  DEFAULT_CATEGORIES,
  DEFAULT_POMODORO,
  MOTIVATIONAL_QUOTES,
} from '../types';

describe('generateId', () => {
  it('should generate a unique ID', () => {
    const id1 = generateId();
    const id2 = generateId();

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('should contain timestamp', () => {
    const before = Date.now();
    const id = generateId();
    const after = Date.now();

    const timestamp = parseInt(id.split('_')[0] ?? '0', 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

describe('formatTime', () => {
  it('should format seconds to MM:SS', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(30)).toBe('0:30');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(599)).toBe('9:59');
    expect(formatTime(600)).toBe('10:00');
  });

  it('should format to HH:MM:SS for times >= 1 hour', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3661)).toBe('1:01:01');
    expect(formatTime(7200)).toBe('2:00:00');
    expect(formatTime(7325)).toBe('2:02:05');
  });
});

describe('formatMinutes', () => {
  it('should format minutes less than 60', () => {
    expect(formatMinutes(0)).toBe('0m');
    expect(formatMinutes(5)).toBe('5m');
    expect(formatMinutes(30)).toBe('30m');
    expect(formatMinutes(59)).toBe('59m');
  });

  it('should format minutes >= 60 to hours', () => {
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(90)).toBe('1h 30m');
    expect(formatMinutes(120)).toBe('2h');
    expect(formatMinutes(150)).toBe('2h 30m');
  });
});

describe('urlMatchesPattern', () => {
  describe('simple pattern matching', () => {
    it('should match exact domain', () => {
      expect(urlMatchesPattern('https://facebook.com', 'facebook.com', false)).toBe(true);
      expect(urlMatchesPattern('https://www.facebook.com', 'facebook.com', false)).toBe(true);
      expect(urlMatchesPattern('https://facebook.com/path', 'facebook.com', false)).toBe(true);
    });

    it('should match partial domain', () => {
      expect(urlMatchesPattern('https://mail.google.com', 'google.com', false)).toBe(true);
      expect(urlMatchesPattern('https://www.reddit.com/r/programming', 'reddit.com', false)).toBe(true);
    });

    it('should not match unrelated domains', () => {
      expect(urlMatchesPattern('https://example.com', 'facebook.com', false)).toBe(false);
      expect(urlMatchesPattern('https://notfacebook.com', 'facebook.com', false)).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(urlMatchesPattern('https://FACEBOOK.COM', 'facebook.com', false)).toBe(true);
      expect(urlMatchesPattern('https://facebook.com', 'FACEBOOK.COM', false)).toBe(true);
    });
  });

  describe('regex pattern matching', () => {
    it('should match regex patterns', () => {
      expect(urlMatchesPattern('https://facebook.com', '^facebook\\.com$', true)).toBe(true);
      expect(urlMatchesPattern('https://www.twitter.com', 'twitter|x\\.com', true)).toBe(true);
    });

    it('should match partial paths with regex', () => {
      expect(urlMatchesPattern('https://youtube.com/watch?v=123', 'youtube\\.com/watch', true)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle invalid URLs gracefully', () => {
      expect(urlMatchesPattern('not-a-url', 'facebook.com', false)).toBe(false);
      expect(urlMatchesPattern('', 'facebook.com', false)).toBe(false);
    });
  });
});

describe('getTodayString', () => {
  it('should return date in YYYY-MM-DD format', () => {
    const today = getTodayString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should match current date', () => {
    const today = getTodayString();
    const expected = new Date().toISOString().split('T')[0];
    expect(today).toBe(expected);
  });
});

describe('DEFAULT_SETTINGS', () => {
  it('should have all required fields', () => {
    expect(DEFAULT_SETTINGS.theme).toBeDefined();
    expect(DEFAULT_SETTINGS.focusMode).toBeDefined();
    expect(DEFAULT_SETTINGS.blocklist).toBeDefined();
    expect(DEFAULT_SETTINGS.whitelist).toBeDefined();
    expect(DEFAULT_SETTINGS.categories).toBeDefined();
    expect(DEFAULT_SETTINGS.pomodoro).toBeDefined();
    expect(DEFAULT_SETTINGS.schedule).toBeDefined();
    expect(DEFAULT_SETTINGS.breakReminders).toBeDefined();
    expect(DEFAULT_SETTINGS.passwordProtection).toBeDefined();
    expect(DEFAULT_SETTINGS.blockedPage).toBeDefined();
    expect(DEFAULT_SETTINGS.notifications).toBeDefined();
    expect(DEFAULT_SETTINGS.sound).toBeDefined();
  });

  it('should start with focus mode disabled', () => {
    expect(DEFAULT_SETTINGS.focusMode.enabled).toBe(false);
    expect(DEFAULT_SETTINGS.focusMode.status).toBe('idle');
  });

  it('should have empty blocklist and whitelist', () => {
    expect(DEFAULT_SETTINGS.blocklist).toEqual([]);
    expect(DEFAULT_SETTINGS.whitelist).toEqual([]);
  });
});

describe('DEFAULT_USAGE_STATS', () => {
  it('should start with zero values', () => {
    expect(DEFAULT_USAGE_STATS.totalFocusTime).toBe(0);
    expect(DEFAULT_USAGE_STATS.totalSessions).toBe(0);
    expect(DEFAULT_USAGE_STATS.totalSitesBlocked).toBe(0);
    expect(DEFAULT_USAGE_STATS.totalPomodorosCompleted).toBe(0);
    expect(DEFAULT_USAGE_STATS.currentStreak).toBe(0);
    expect(DEFAULT_USAGE_STATS.longestStreak).toBe(0);
  });

  it('should have empty arrays', () => {
    expect(DEFAULT_USAGE_STATS.dailyStats).toEqual([]);
    expect(DEFAULT_USAGE_STATS.sessions).toEqual([]);
  });
});

describe('DEFAULT_CATEGORIES', () => {
  it('should have predefined categories', () => {
    expect(DEFAULT_CATEGORIES.length).toBeGreaterThan(0);

    const categoryIds = DEFAULT_CATEGORIES.map(c => c.id);
    expect(categoryIds).toContain('social');
    expect(categoryIds).toContain('news');
    expect(categoryIds).toContain('entertainment');
  });

  it('should have valid category structure', () => {
    DEFAULT_CATEGORIES.forEach(category => {
      expect(category.id).toBeTruthy();
      expect(category.name).toBeTruthy();
      expect(category.icon).toBeTruthy();
      expect(Array.isArray(category.patterns)).toBe(true);
      expect(category.patterns.length).toBeGreaterThan(0);
      expect(typeof category.enabled).toBe('boolean');
    });
  });
});

describe('DEFAULT_POMODORO', () => {
  it('should have standard Pomodoro values', () => {
    expect(DEFAULT_POMODORO.focusDuration).toBe(25);
    expect(DEFAULT_POMODORO.shortBreakDuration).toBe(5);
    expect(DEFAULT_POMODORO.longBreakDuration).toBe(15);
    expect(DEFAULT_POMODORO.sessionsUntilLongBreak).toBe(4);
  });
});

describe('MOTIVATIONAL_QUOTES', () => {
  it('should have multiple quotes', () => {
    expect(MOTIVATIONAL_QUOTES.length).toBeGreaterThan(10);
  });

  it('should have valid quote structure', () => {
    MOTIVATIONAL_QUOTES.forEach(quote => {
      expect(quote.text).toBeTruthy();
      expect(quote.author).toBeTruthy();
    });
  });
});

describe('hashPassword', () => {
  it('should return salt:hash format', async () => {
    const hash = await hashPassword('testpassword');
    expect(hash).toContain(':');
    const [salt, hashValue] = hash.split(':');
    expect(salt).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(hashValue).toHaveLength(64); // 256 bits = 32 bytes = 64 hex chars
  });

  it('should produce different hashes for same password (random salt)', async () => {
    const hash1 = await hashPassword('testpassword');
    const hash2 = await hashPassword('testpassword');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyPassword', () => {
  it('should verify correct password', async () => {
    const hash = await hashPassword('mypassword');
    const result = await verifyPassword('mypassword', hash);
    expect(result).toBe(true);
  });

  it('should reject wrong password', async () => {
    const hash = await hashPassword('mypassword');
    const result = await verifyPassword('wrongpassword', hash);
    expect(result).toBe(false);
  });

  it('should reject legacy SHA-256 hash format', async () => {
    const legacyHash = 'a'.repeat(64); // Old SHA-256 format, no colon
    const result = await verifyPassword('anything', legacyHash);
    expect(result).toBe(false);
  });
});
