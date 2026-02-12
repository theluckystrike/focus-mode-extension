import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Timer from './components/Timer';
import QuickStats from './components/QuickStats';
import ModeSelector from './components/ModeSelector';
import { messaging } from '../lib/messaging';
import { t } from '../lib/i18n';
import type { Settings, TimerState, UsageStats, TimerMode } from '../lib/types';

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<string>('free');

  // Password modal state
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordAction, setPasswordAction] = useState<'stop' | 'pause' | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [settingsRes, timerRes, statsRes] = await Promise.all([
        messaging.send<void, Settings>('GET_SETTINGS'),
        messaging.send<void, TimerState>('GET_TIMER_STATE'),
        messaging.send<void, UsageStats>('GET_STATS'),
      ]);

      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data);
      }
      if (timerRes.success && timerRes.data) {
        setTimerState(timerRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      // Load license tier
      try {
        const tierRes = await messaging.send<void, { tier: string }>('GET_TIER');
        if (tierRes.success && tierRes.data) {
          setTier(tierRes.data.tier);
        }
      } catch {
        // Stay on free tier
      }
    } catch (e) {
      setError(t('errConnectionFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Poll timer state every second when active
    const interval = setInterval(async () => {
      try {
        const timerRes = await messaging.send<void, TimerState>('GET_TIMER_STATE');
        if (timerRes.success && timerRes.data) {
          setTimerState(timerRes.data);
        }
      } catch {
        // Extension context may be invalidated, ignore
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loadData]);

  const handleSettingsClick = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleStartFocus = async (mode: TimerMode, duration?: number) => {
    // Feature gate: custom and indefinite modes are Pro-only
    if (mode === 'custom' || mode === 'indefinite') {
      if (tier === 'free') {
        chrome.tabs.create({
          url: chrome.runtime.getURL('upgrade.html?feature=' + (mode === 'custom' ? 'custom_timer' : 'indefinite_mode') + '&reason=' + encodeURIComponent(t('errCustomModeRequiresPro')))
        });
        return;
      }
    }

    // Record focus session usage for free tier tracking
    if (tier === 'free') {
      try {
        const gateResult = await messaging.send<{ featureId: string }, { allowed: boolean; reason: string | null }>('CHECK_FEATURE_GATE', { featureId: 'focus_sessions' });
        if (gateResult.success && gateResult.data && !gateResult.data.allowed) {
          chrome.tabs.create({
            url: chrome.runtime.getURL('upgrade.html?feature=focus_sessions&reason=' + encodeURIComponent(gateResult.data.reason || t('errDailySessionLimit')))
          });
          return;
        }
        // Record the usage
        await messaging.send('RECORD_FEATURE_USAGE', { featureId: 'focus_sessions' });
      } catch {
        // Don't block on gate check failure
      }
    }

    // Original logic continues...
    const response = await messaging.send<{ mode: TimerMode; duration?: number }, TimerState>(
      'START_FOCUS',
      { mode, duration }
    );
    if (response.success && response.data) {
      setTimerState(response.data);
    }
  };

  const handleStopFocus = async () => {
    if (settings?.passwordProtection.enabled && settings.passwordProtection.passwordHash) {
      setPasswordAction('stop');
      setPasswordInput('');
      setPasswordError(null);
      setPasswordModalVisible(true);
      return;
    }
    await executeStopFocus();
  };

  const executeStopFocus = async () => {
    const response = await messaging.send<void, TimerState>('STOP_FOCUS');
    if (response.success && response.data) {
      setTimerState(response.data);
      // Reload stats after stopping
      const statsRes = await messaging.send<void, UsageStats>('GET_STATS');
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    }
  };

  const handlePauseFocus = async () => {
    if (settings?.passwordProtection.enabled && settings.passwordProtection.passwordHash) {
      setPasswordAction('pause');
      setPasswordInput('');
      setPasswordError(null);
      setPasswordModalVisible(true);
      return;
    }
    await executePauseFocus();
  };

  const executePauseFocus = async () => {
    const response = await messaging.send<void, TimerState>('PAUSE_FOCUS');
    if (response.success && response.data) {
      setTimerState(response.data);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordInput.trim()) {
      setPasswordError(t('errEnterPassword'));
      return;
    }

    const response = await messaging.send<{ password: string }, { valid: boolean }>(
      'VERIFY_PASSWORD',
      { password: passwordInput }
    );

    if (response.success && response.data?.valid) {
      setPasswordModalVisible(false);
      setPasswordInput('');
      setPasswordError(null);

      if (passwordAction === 'stop') {
        await executeStopFocus();
      } else if (passwordAction === 'pause') {
        await executePauseFocus();
      }
      setPasswordAction(null);
    } else {
      setPasswordError(t('errIncorrectPassword'));
    }
  };

  const handlePasswordCancel = () => {
    setPasswordModalVisible(false);
    setPasswordInput('');
    setPasswordError(null);
    setPasswordAction(null);
  };

  const handleResumeFocus = async () => {
    const response = await messaging.send<void, TimerState>('RESUME_FOCUS');
    if (response.success && response.data) {
      setTimerState(response.data);
    }
  };

  const handleStartBreak = async () => {
    const response = await messaging.send<void, TimerState>('START_BREAK');
    if (response.success && response.data) {
      setTimerState(response.data);
    }
  };

  const handleSkipBreak = async () => {
    const response = await messaging.send<void, TimerState>('SKIP_BREAK');
    if (response.success && response.data) {
      setTimerState(response.data);
    }
  };

  if (loading) {
    return (
      <div className="zovo-popup">
        <Header title={t('appName')} onSettingsClick={handleSettingsClick} tier={tier} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-zovo-text-secondary">{t('msgLoading')}</div>
        </main>
        <Footer tier={tier} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="zovo-popup">
        <Header title={t('appName')} onSettingsClick={handleSettingsClick} tier={tier} />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-zovo-error mb-2">{t('msgError')}</div>
          <div className="text-zovo-text-secondary text-sm">{error}</div>
        </main>
        <Footer tier={tier} />
      </div>
    );
  }

  const isActive = timerState?.status === 'focusing' || timerState?.status === 'break';
  const isPaused = timerState?.status === 'paused';

  return (
    <div className="zovo-popup">
      <Header
        title={t('appName')}
        onSettingsClick={handleSettingsClick}
        badge={isActive ? t('lblActive') : undefined}
        tier={tier}
      />

      <main className="flex-1 p-4 space-y-4">
        {/* Timer Display */}
        <Timer
          timerState={timerState}
          onStart={() => handleStartFocus(settings?.focusMode.timerMode ?? 'pomodoro')}
          onStop={handleStopFocus}
          onPause={handlePauseFocus}
          onResume={handleResumeFocus}
          onStartBreak={handleStartBreak}
          onSkipBreak={handleSkipBreak}
        />

        {/* Mode Selector (only show when idle) */}
        {!isActive && !isPaused && settings && (
          <ModeSelector
            currentMode={settings.focusMode.timerMode}
            customDuration={settings.focusMode.customDuration}
            pomodoroSettings={settings.pomodoro}
            onStartFocus={handleStartFocus}
          />
        )}

        {/* Quick Stats */}
        {stats && <QuickStats stats={stats} />}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSettingsClick}
            className="zovo-btn zovo-btn-secondary flex-1 text-sm"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            {t('btnSettings')}
          </button>
          <button
            onClick={() => chrome.tabs.create({ url: 'options.html#stats' })}
            className="zovo-btn zovo-btn-secondary flex-1 text-sm"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            {t('btnStatistics')}
          </button>
        </div>

        {/* Upgrade Banner for Free Users */}
        {tier === 'free' && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-zovo-border bg-gradient-to-r from-violet-950/30 to-purple-950/20 px-3 py-2.5">
            <span className="text-xs text-zovo-text-secondary">{t('msgUnlockAllFeatures')}</span>
            <button
              onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('upgrade.html') })}
              className="text-xs font-semibold text-zovo-violet hover:text-violet-300 transition-colors"
            >
              {t('btnUpgradePro')}
            </button>
          </div>
        )}
      </main>

      <Footer version={chrome.runtime.getManifest().version} tier={tier} />

      {/* Password Verification Modal */}
      {passwordModalVisible && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-zovo-border bg-zovo-bg-secondary p-5 shadow-xl">
            <h3 className="mb-1 text-lg font-semibold text-zovo-text-primary">
              {t('ttlPasswordRequired')}
            </h3>
            <p className="mb-4 text-sm text-zovo-text-secondary">
              {passwordAction === 'stop' ? t('msgPasswordToStop') : t('msgPasswordToPause')}
            </p>

            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePasswordSubmit();
                if (e.key === 'Escape') handlePasswordCancel();
              }}
              placeholder={t('plhEnterPassword')}
              aria-label={t('plhEnterPassword')}
              autoFocus
              className="mb-2 w-full rounded-lg border border-zovo-border bg-zovo-bg-primary px-3 py-2 text-sm text-zovo-text-primary placeholder-zovo-text-muted outline-none focus:border-zovo-violet focus:ring-1 focus:ring-zovo-violet"
            />

            {passwordError && (
              <p className="mb-2 text-xs text-zovo-error">{passwordError}</p>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={handlePasswordCancel}
                className="zovo-btn zovo-btn-secondary flex-1 text-sm"
              >
                {t('btnCancel')}
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="zovo-btn zovo-btn-primary flex-1 text-sm"
              >
                {t('btnConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
