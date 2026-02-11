import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Timer from './components/Timer';
import QuickStats from './components/QuickStats';
import ModeSelector from './components/ModeSelector';
import { messaging } from '../lib/messaging';
import type { Settings, TimerState, UsageStats, TimerMode } from '../lib/types';

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e) {
      setError('Failed to connect to extension');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Poll timer state every second when active
    const interval = setInterval(async () => {
      const timerRes = await messaging.send<void, TimerState>('GET_TIMER_STATE');
      if (timerRes.success && timerRes.data) {
        setTimerState(timerRes.data);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loadData]);

  const handleSettingsClick = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleStartFocus = async (mode: TimerMode, duration?: number) => {
    const response = await messaging.send<{ mode: TimerMode; duration?: number }, TimerState>(
      'START_FOCUS',
      { mode, duration }
    );
    if (response.success && response.data) {
      setTimerState(response.data);
    }
  };

  const handleStopFocus = async () => {
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
    const response = await messaging.send<void, TimerState>('PAUSE_FOCUS');
    if (response.success && response.data) {
      setTimerState(response.data);
    }
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
        <Header title="Focus Mode" onSettingsClick={handleSettingsClick} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-zovo-text-secondary">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="zovo-popup">
        <Header title="Focus Mode" onSettingsClick={handleSettingsClick} />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-zovo-error mb-2">Error</div>
          <div className="text-zovo-text-secondary text-sm">{error}</div>
        </main>
        <Footer />
      </div>
    );
  }

  const isActive = timerState?.status === 'focusing' || timerState?.status === 'break';
  const isPaused = timerState?.status === 'paused';

  return (
    <div className="zovo-popup">
      <Header
        title="Focus Mode"
        onSettingsClick={handleSettingsClick}
        badge={isActive ? 'ACTIVE' : undefined}
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
            >
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Settings
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
            >
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            Statistics
          </button>
        </div>
      </main>

      <Footer version={chrome.runtime.getManifest().version} />
    </div>
  );
};

export default App;
