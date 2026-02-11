import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { messaging } from '../lib/messaging';
import { hashPassword, formatMinutes, getTodayString } from '../lib/types';
import type { Settings, UsageStats, BlockRule, WhitelistRule, CategoryPreset } from '../lib/types';
import '../popup/styles.css';

type Tab = 'general' | 'blocking' | 'schedule' | 'stats' | 'advanced';

const Options: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [newBlockPattern, setNewBlockPattern] = useState('');
  const [newWhitelistPattern, setNewWhitelistPattern] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [removePasswordInput, setRemovePasswordInput] = useState('');
  const [removePasswordError, setRemovePasswordError] = useState<string | null>(null);

  useEffect(() => {
    loadData();

    // Check URL hash for initial tab
    const hash = window.location.hash.replace('#', '');
    if (['general', 'blocking', 'schedule', 'stats', 'advanced'].includes(hash)) {
      setActiveTab(hash as Tab);
    }
  }, []);

  const loadData = async () => {
    try {
      const [settingsRes, statsRes] = await Promise.all([
        messaging.send<void, Settings>('GET_SETTINGS'),
        messaging.send<void, UsageStats>('GET_STATS'),
      ]);

      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = useCallback(async (updates: Partial<Settings>) => {
    if (!settings) return;

    setSaving(true);
    try {
      const newSettings = { ...settings, ...updates };
      const response = await messaging.send('UPDATE_SETTINGS', newSettings);
      if (response.success) {
        setSettings(newSettings);
        setMessage({ type: 'success', text: 'Settings saved!' });
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to save settings' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }, [settings]);

  const handleAddToBlocklist = async () => {
    if (!newBlockPattern.trim() || !settings) return;

    const response = await messaging.send<{ pattern: string; isRegex: boolean }, BlockRule>(
      'ADD_TO_BLOCKLIST',
      { pattern: newBlockPattern.trim(), isRegex }
    );

    if (response.success) {
      await loadData();
      setNewBlockPattern('');
      setIsRegex(false);
      setMessage({ type: 'success', text: 'Site added to blocklist' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRemoveFromBlocklist = async (id: string) => {
    await messaging.send('REMOVE_FROM_BLOCKLIST', { id });
    await loadData();
  };

  const handleAddToWhitelist = async () => {
    if (!newWhitelistPattern.trim() || !settings) return;

    const response = await messaging.send<{ pattern: string; isRegex: boolean }, WhitelistRule>(
      'ADD_TO_WHITELIST',
      { pattern: newWhitelistPattern.trim(), isRegex: false }
    );

    if (response.success) {
      await loadData();
      setNewWhitelistPattern('');
      setMessage({ type: 'success', text: 'Site added to whitelist' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRemoveFromWhitelist = async (id: string) => {
    await messaging.send('REMOVE_FROM_WHITELIST', { id });
    await loadData();
  };

  const handleToggleCategory = async (categoryId: string) => {
    if (!settings) return;

    const updatedCategories = settings.categories.map(cat =>
      cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
    );

    await saveSettings({ categories: updatedCategories });
  };

  const handleSetPassword = async () => {
    if (!settings) return;
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Password must be at least 4 characters' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const hash = await hashPassword(newPassword);
    await saveSettings({
      passwordProtection: {
        ...settings.passwordProtection,
        enabled: true,
        passwordHash: hash,
      },
    });

    setNewPassword('');
    setConfirmPassword('');
  };

  const handleRemovePassword = async () => {
    if (!settings) return;

    if (!removePasswordInput.trim()) {
      setRemovePasswordError('Enter your current password');
      return;
    }

    const response = await messaging.send<{ password: string }, { valid: boolean }>(
      'VERIFY_PASSWORD',
      { password: removePasswordInput }
    );

    if (!response.success || !response.data?.valid) {
      setRemovePasswordError('Incorrect password');
      return;
    }

    await saveSettings({
      passwordProtection: {
        ...settings.passwordProtection,
        enabled: false,
        passwordHash: undefined,
      },
    });

    setRemovePasswordInput('');
    setRemovePasswordError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zovo-black text-zovo-text-primary flex items-center justify-center">
        <div className="text-zovo-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!settings || !stats) {
    return (
      <div className="min-h-screen bg-zovo-black text-zovo-text-primary flex items-center justify-center">
        <div className="text-zovo-error">Failed to load settings</div>
      </div>
    );
  }

  const today = getTodayString();
  const todayStats = stats.dailyStats.find(d => d.date === today);

  return (
    <div className="min-h-screen bg-zovo-black text-zovo-text-primary">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#7C3AED" />
            <circle cx="20" cy="20" r="10" fill="none" stroke="white" strokeWidth="3" />
            <circle cx="20" cy="20" r="3" fill="white" />
          </svg>
          <div>
            <h1 className="text-2xl font-semibold">Focus Mode Pro</h1>
            <p className="text-zovo-text-secondary">Settings & Configuration</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-zovo-border">
          {(['general', 'blocking', 'schedule', 'stats', 'advanced'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-zovo-violet border-b-2 border-zovo-violet -mb-px'
                  : 'text-zovo-text-secondary hover:text-zovo-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <>
              {/* Pomodoro Settings */}
              <div className="zovo-card">
                <h2 className="text-lg font-semibold mb-4">Pomodoro Timer</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Focus Duration</label>
                    <select
                      value={settings.pomodoro.focusDuration}
                      onChange={(e) => saveSettings({
                        pomodoro: { ...settings.pomodoro, focusDuration: Number(e.target.value) }
                      })}
                      className="zovo-input"
                    >
                      {[15, 20, 25, 30, 45, 60].map((min) => (
                        <option key={min} value={min}>{min} minutes</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Short Break</label>
                    <select
                      value={settings.pomodoro.shortBreakDuration}
                      onChange={(e) => saveSettings({
                        pomodoro: { ...settings.pomodoro, shortBreakDuration: Number(e.target.value) }
                      })}
                      className="zovo-input"
                    >
                      {[3, 5, 10, 15].map((min) => (
                        <option key={min} value={min}>{min} minutes</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Long Break</label>
                    <select
                      value={settings.pomodoro.longBreakDuration}
                      onChange={(e) => saveSettings({
                        pomodoro: { ...settings.pomodoro, longBreakDuration: Number(e.target.value) }
                      })}
                      className="zovo-input"
                    >
                      {[15, 20, 30, 45].map((min) => (
                        <option key={min} value={min}>{min} minutes</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Long Break After</label>
                    <select
                      value={settings.pomodoro.sessionsUntilLongBreak}
                      onChange={(e) => saveSettings({
                        pomodoro: { ...settings.pomodoro, sessionsUntilLongBreak: Number(e.target.value) }
                      })}
                      className="zovo-input"
                    >
                      {[2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>{num} sessions</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.pomodoro.autoStartBreaks}
                      onChange={(e) => saveSettings({
                        pomodoro: { ...settings.pomodoro, autoStartBreaks: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-zovo-border bg-zovo-bg-tertiary accent-zovo-violet"
                    />
                    <span className="text-sm">Auto-start breaks after focus sessions</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.pomodoro.autoStartFocus}
                      onChange={(e) => saveSettings({
                        pomodoro: { ...settings.pomodoro, autoStartFocus: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-zovo-border bg-zovo-bg-tertiary accent-zovo-violet"
                    />
                    <span className="text-sm">Auto-start focus after breaks</span>
                  </label>
                </div>
              </div>

              {/* Break Reminders */}
              <div className="zovo-card">
                <h2 className="text-lg font-semibold mb-4">Break Reminders</h2>
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={settings.breakReminders.enabled}
                    onChange={(e) => saveSettings({
                      breakReminders: { ...settings.breakReminders, enabled: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-zovo-border bg-zovo-bg-tertiary accent-zovo-violet"
                  />
                  <span className="text-sm">Enable break reminders during focus</span>
                </label>
                {settings.breakReminders.enabled && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Remind every</label>
                    <select
                      value={settings.breakReminders.intervalMinutes}
                      onChange={(e) => saveSettings({
                        breakReminders: { ...settings.breakReminders, intervalMinutes: Number(e.target.value) }
                      })}
                      className="zovo-input w-48"
                    >
                      {[15, 20, 30, 45, 60].map((min) => (
                        <option key={min} value={min}>{min} minutes</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="zovo-card">
                <h2 className="text-lg font-semibold mb-4">Notifications</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.sessionComplete}
                      onChange={(e) => saveSettings({
                        notifications: { ...settings.notifications, sessionComplete: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-zovo-border bg-zovo-bg-tertiary accent-zovo-violet"
                    />
                    <span className="text-sm">Notify when focus session completes</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.breakComplete}
                      onChange={(e) => saveSettings({
                        notifications: { ...settings.notifications, breakComplete: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-zovo-border bg-zovo-bg-tertiary accent-zovo-violet"
                    />
                    <span className="text-sm">Notify when break ends</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Blocking Tab */}
          {activeTab === 'blocking' && (
            <>
              {/* Category Presets */}
              <div className="zovo-card">
                <h2 className="text-lg font-semibold mb-4">Block Categories</h2>
                <p className="text-sm text-zovo-text-secondary mb-4">
                  Enable categories to block groups of common distracting sites.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {settings.categories.map((category) => (
                    <label
                      key={category.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        category.enabled
                          ? 'border-zovo-violet bg-zovo-violet/10'
                          : 'border-zovo-border bg-zovo-bg-secondary hover:border-zovo-border-light'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={category.enabled}
                        onChange={() => handleToggleCategory(category.id)}
                        className="w-4 h-4 rounded border-zovo-border bg-zovo-bg-tertiary accent-zovo-violet"
                      />
                      <span className="text-lg">{category.icon}</span>
                      <div>
                        <div className="text-sm font-medium">{category.name}</div>
                        <div className="text-xs text-zovo-text-muted">
                          {category.patterns.length} sites
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Blocklist */}
              <div className="zovo-card">
                <h2 className="text-lg font-semibold mb-4">Custom Blocklist</h2>
                <div className="flex gap-2 mb-4 items-center">
                  <input
                    type="text"
                    value={newBlockPattern}
                    onChange={(e) => setNewBlockPattern(e.target.value)}
                    placeholder={isRegex ? 'e.g., ^https?://(www\\.)?facebook\\.com' : 'e.g., facebook.com or *.reddit.com'}
                    className="zovo-input flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddToBlocklist()}
                  />
                  <label className={`flex items-center gap-1.5 cursor-pointer select-none px-2 py-1 rounded border text-xs ${isRegex ? 'border-zovo-violet text-zovo-violet bg-zovo-violet/10' : 'border-zovo-border text-zovo-text-muted'}`}>
                    <input
                      type="checkbox"
                      checked={isRegex}
                      onChange={(e) => setIsRegex(e.target.checked)}
                      className="w-3 h-3 rounded border-zovo-border bg-zovo-bg-tertiary accent-zovo-violet"
                    />
                    Regex
                  </label>
                  <button
                    onClick={handleAddToBlocklist}
                    className="zovo-btn zovo-btn-primary"
                  >
                    Add
                  </button>
                </div>
                {settings.blocklist.length > 0 ? (
                  <ul className="space-y-2">
                    {settings.blocklist.map((rule) => (
                      <li
                        key={rule.id}
                        className="flex items-center justify-between p-2 bg-zovo-bg-tertiary rounded"
                      >
                        <span className="text-sm flex items-center gap-2">
                          {rule.pattern}
                          {rule.isRegex && (
                            <span className="text-xs text-zovo-text-muted border border-zovo-border rounded px-1">regex</span>
                          )}
                        </span>
                        <button
                          onClick={() => handleRemoveFromBlocklist(rule.id)}
                          className="text-zovo-error text-sm hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zovo-text-muted">No custom blocked sites yet.</p>
                )}
              </div>

              {/* Whitelist */}
              <div className="zovo-card">
                <h2 className="text-lg font-semibold mb-4">Whitelist (Always Allowed)</h2>
                <p className="text-sm text-zovo-text-secondary mb-4">
                  These sites will never be blocked, even during focus mode.
                </p>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newWhitelistPattern}
                    onChange={(e) => setNewWhitelistPattern(e.target.value)}
                    placeholder="e.g., docs.google.com"
                    className="zovo-input flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddToWhitelist()}
                  />
                  <button
                    onClick={handleAddToWhitelist}
                    className="zovo-btn zovo-btn-primary"
                  >
                    Add
                  </button>
                </div>
                {settings.whitelist.length > 0 ? (
                  <ul className="space-y-2">
                    {settings.whitelist.map((rule) => (
                      <li
                        key={rule.id}
                        className="flex items-center justify-between p-2 bg-zovo-bg-tertiary rounded"
                      >
                        <span className="text-sm">{rule.pattern}</span>
                        <button
                          onClick={() => handleRemoveFromWhitelist(rule.id)}
                          className="text-zovo-error text-sm hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zovo-text-muted">No whitelisted sites yet.</p>
                )}
              </div>
            </>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="zovo-card">
              <h2 className="text-lg font-semibold mb-4">Auto-Enable Schedule</h2>
              <label className="flex items-center gap-3 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  checked={settings.schedule.enabled}
                  onChange={(e) => saveSettings({
                    schedule: { ...settings.schedule, enabled: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-zovo-border bg-zovo-bg-tertiary accent-zovo-violet"
                />
                <span className="text-sm">Automatically start focus mode on schedule</span>
              </label>

              {settings.schedule.enabled && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">Active Days</label>
                    <div className="flex gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <button
                          key={day}
                          onClick={() => {
                            const newDays = settings.schedule.days.includes(index)
                              ? settings.schedule.days.filter(d => d !== index)
                              : [...settings.schedule.days, index];
                            saveSettings({
                              schedule: { ...settings.schedule, days: newDays }
                            });
                          }}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            settings.schedule.days.includes(index)
                              ? 'bg-zovo-violet text-white'
                              : 'bg-zovo-bg-tertiary text-zovo-text-secondary hover:bg-zovo-bg-elevated'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Time</label>
                      <input
                        type="time"
                        value={settings.schedule.startTime}
                        onChange={(e) => saveSettings({
                          schedule: { ...settings.schedule, startTime: e.target.value }
                        })}
                        className="zovo-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Time</label>
                      <input
                        type="time"
                        value={settings.schedule.endTime}
                        onChange={(e) => saveSettings({
                          schedule: { ...settings.schedule, endTime: e.target.value }
                        })}
                        className="zovo-input"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <>
              {/* Today's Summary */}
              <div className="zovo-card">
                <h2 className="text-lg font-semibold mb-4">Today's Summary</h2>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-zovo-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold text-focus-green">
                      {formatMinutes(todayStats?.totalFocusTime ?? 0)}
                    </div>
                    <div className="text-sm text-zovo-text-muted">Focus Time</div>
                  </div>
                  <div className="text-center p-4 bg-zovo-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold text-zovo-violet">
                      {todayStats?.sessionsCompleted ?? 0}
                    </div>
                    <div className="text-sm text-zovo-text-muted">Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-zovo-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold text-zovo-error">
                      {todayStats?.sitesBlocked ?? 0}
                    </div>
                    <div className="text-sm text-zovo-text-muted">Sites Blocked</div>
                  </div>
                  <div className="text-center p-4 bg-zovo-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold text-zovo-warning">
                      {todayStats?.pomodorosCompleted ?? 0}
                    </div>
                    <div className="text-sm text-zovo-text-muted">Pomodoros</div>
                  </div>
                </div>
              </div>

              {/* All-Time Stats */}
              <div className="zovo-card">
                <h2 className="text-lg font-semibold mb-4">All-Time Statistics</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-zovo-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold text-focus-green">
                      {formatMinutes(stats.totalFocusTime)}
                    </div>
                    <div className="text-sm text-zovo-text-muted">Total Focus Time</div>
                  </div>
                  <div className="text-center p-4 bg-zovo-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold text-zovo-violet">
                      {stats.totalSessions}
                    </div>
                    <div className="text-sm text-zovo-text-muted">Total Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-zovo-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold text-zovo-error">
                      {stats.totalSitesBlocked}
                    </div>
                    <div className="text-sm text-zovo-text-muted">Sites Blocked</div>
                  </div>
                </div>
              </div>

              {/* Streaks */}
              <div className="zovo-card">
                <h2 className="text-lg font-semibold mb-4">Streaks</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-zovo-bg-tertiary rounded-lg">
                    <div className="text-3xl font-bold text-zovo-warning">
                      {stats.currentStreak}
                    </div>
                    <div className="text-sm text-zovo-text-muted">Current Streak (days)</div>
                  </div>
                  <div className="text-center p-4 bg-zovo-bg-tertiary rounded-lg">
                    <div className="text-3xl font-bold text-zovo-violet">
                      {stats.longestStreak}
                    </div>
                    <div className="text-sm text-zovo-text-muted">Longest Streak (days)</div>
                  </div>
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="zovo-card">
                <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
                {stats.sessions.length > 0 ? (
                  <div className="space-y-2">
                    {stats.sessions.slice(0, 10).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-zovo-bg-tertiary rounded"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {new Date(session.startTime).toLocaleDateString()} at{' '}
                            {new Date(session.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-xs text-zovo-text-muted">
                            {session.mode} mode - {session.actualDuration ?? 0} min
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            session.completed
                              ? 'bg-focus-green/20 text-focus-green'
                              : 'bg-zovo-error/20 text-zovo-error'
                          }`}
                        >
                          {session.completed ? 'Completed' : 'Stopped'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zovo-text-muted">No sessions recorded yet.</p>
                )}
              </div>
            </>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <>
              {/* Blocked Page Settings */}
              <div className="zovo-card">
                <h2 className="text-lg font-semibold mb-4">Blocked Page</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.blockedPage.showTimer}
                      onChange={(e) => saveSettings({
                        blockedPage: { ...settings.blockedPage, showTimer: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-zovo-border bg-zovo-bg-tertiary accent-zovo-violet"
                    />
                    <span className="text-sm">Show remaining time on blocked page</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.blockedPage.showQuote}
                      onChange={(e) => saveSettings({
                        blockedPage: { ...settings.blockedPage, showQuote: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-zovo-border bg-zovo-bg-tertiary accent-zovo-violet"
                    />
                    <span className="text-sm">Show motivational quote on blocked page</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.blockedPage.allowEmergencyUnlock}
                      onChange={(e) => saveSettings({
                        blockedPage: { ...settings.blockedPage, allowEmergencyUnlock: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-zovo-border bg-zovo-bg-tertiary accent-zovo-violet"
                    />
                    <span className="text-sm">Allow emergency unlock (with cooldown)</span>
                  </label>
                </div>
                {settings.blockedPage.allowEmergencyUnlock && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Emergency Unlock Cooldown</label>
                    <select
                      value={settings.blockedPage.emergencyCooldownMinutes}
                      onChange={(e) => saveSettings({
                        blockedPage: { ...settings.blockedPage, emergencyCooldownMinutes: Number(e.target.value) }
                      })}
                      className="zovo-input w-48"
                    >
                      {[5, 10, 15, 30, 60].map((min) => (
                        <option key={min} value={min}>{min} minutes</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Password Protection */}
              <div className="zovo-card">
                <h2 className="text-lg font-semibold mb-4">Password Protection</h2>
                <p className="text-sm text-zovo-text-secondary mb-4">
                  Require a password to stop focus mode or change settings during focus.
                </p>
                {settings.passwordProtection.enabled ? (
                  <div>
                    {settings.passwordProtection.passwordHash && !settings.passwordProtection.passwordHash.includes(':') ? (
                      <div>
                        <p className="text-sm text-zovo-warning mb-4">
                          Your password uses an outdated format. Please remove it and set a new one.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-focus-green mb-4">Password protection is enabled.</p>
                    )}
                    <div className="flex gap-2 items-center">
                      <input
                        type="password"
                        value={removePasswordInput}
                        onChange={(e) => {
                          setRemovePasswordInput(e.target.value);
                          setRemovePasswordError(null);
                        }}
                        placeholder="Enter current password"
                        className="zovo-input w-64"
                      />
                      <button
                        onClick={handleRemovePassword}
                        className="zovo-btn zovo-btn-secondary text-zovo-error"
                        disabled={!removePasswordInput.trim()}
                      >
                        Remove Password
                      </button>
                    </div>
                    {removePasswordError && (
                      <p className="mt-2 text-sm text-zovo-error">{removePasswordError}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="zovo-input w-64"
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="zovo-input w-64"
                        placeholder="Confirm password"
                      />
                    </div>
                    <button
                      onClick={handleSetPassword}
                      className="zovo-btn zovo-btn-primary"
                      disabled={!newPassword || !confirmPassword}
                    >
                      Set Password
                    </button>
                  </div>
                )}
              </div>

              {/* About */}
              <div className="zovo-card">
                <h2 className="text-lg font-semibold mb-4">About</h2>
                <p className="text-zovo-text-secondary text-sm">
                  Focus Mode Pro is part of the Zovo family of privacy-first Chrome extensions.
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className="text-zovo-text-muted">Version:</span>{' '}
                    <span className="text-zovo-text-secondary">
                      {chrome.runtime.getManifest().version}
                    </span>
                  </p>
                  <p>
                    <span className="text-zovo-text-muted">Keyboard Shortcut:</span>{' '}
                    <code className="bg-zovo-bg-tertiary px-2 py-1 rounded text-xs">
                      Alt+Shift+F
                    </code>
                  </p>
                  <p>
                    <span className="text-zovo-text-muted">Website:</span>{' '}
                    <a
                      href="https://zovo.one"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zovo-violet hover:underline"
                    >
                      zovo.one
                    </a>
                  </p>
                  <p>
                    <span className="text-zovo-text-muted">Support:</span>{' '}
                    <a
                      href="mailto:support@zovo.one"
                      className="text-zovo-violet hover:underline"
                    >
                      support@zovo.one
                    </a>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Save Message */}
        {message && (
          <div
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg ${
              message.type === 'success'
                ? 'bg-focus-green/20 text-focus-green border border-focus-green'
                : 'bg-zovo-error/20 text-zovo-error border border-zovo-error'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

// Mount React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Options />
    </React.StrictMode>
  );
}
