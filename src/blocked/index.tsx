import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { messaging } from '../lib/messaging';
import { formatTime } from '../lib/types';
import type { TimerState, Settings } from '../lib/types';
import '../popup/styles.css';

interface Quote {
  text: string;
  author: string;
}

const BlockedPage: React.FC = () => {
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [blockedUrl, setBlockedUrl] = useState<string>('');
  const [unlockStatus, setUnlockStatus] = useState<string | null>(null);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [timerRes, settingsRes, quoteRes] = await Promise.all([
        messaging.send<void, TimerState>('GET_TIMER_STATE'),
        messaging.send<void, Settings>('GET_SETTINGS'),
        messaging.send<void, Quote>('GET_QUOTE'),
      ]);

      if (timerRes.success && timerRes.data) {
        setTimerState(timerRes.data);
      }
      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data);
      }
      if (quoteRes.success && quoteRes.data) {
        setQuote(quoteRes.data);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  }, []);

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url');
    if (url) {
      try {
        setBlockedUrl(decodeURIComponent(url));
      } catch {
        setBlockedUrl(url);
      }
    }

    loadData();

    // Update timer every second
    const interval = setInterval(async () => {
      const timerRes = await messaging.send<void, TimerState>('GET_TIMER_STATE');
      if (timerRes.success && timerRes.data) {
        setTimerState(timerRes.data);

        // If focus mode ended, redirect back
        if (timerRes.data.status === 'idle' && blockedUrl) {
          window.location.href = blockedUrl;
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loadData, blockedUrl]);

  const handleEmergencyUnlock = async () => {
    if (!showUnlockConfirm) {
      setShowUnlockConfirm(true);
      return;
    }

    // If password protection is enabled, require password before unlocking
    if (settings?.passwordProtection.enabled && settings.passwordProtection.passwordHash) {
      setShowPasswordPrompt(true);
      setPasswordInput('');
      setPasswordError(null);
      return;
    }

    await executeEmergencyUnlock();
  };

  const executeEmergencyUnlock = async () => {
    const response = await messaging.send<void, { allowed: boolean; reason?: string }>(
      'EMERGENCY_UNLOCK'
    );

    if (response.success && response.data) {
      if (response.data.allowed) {
        setUnlockStatus('Unlocking... Redirecting...');
        setTimeout(() => {
          if (blockedUrl) {
            window.location.href = blockedUrl;
          }
        }, 1000);
      } else {
        setUnlockStatus(response.data.reason ?? 'Unable to unlock');
        setShowUnlockConfirm(false);
        setShowPasswordPrompt(false);
      }
    }
  };

  const handleUnlockPasswordSubmit = async () => {
    if (!passwordInput.trim()) {
      setPasswordError('Please enter your password');
      return;
    }

    const response = await messaging.send<{ password: string }, { valid: boolean }>(
      'VERIFY_PASSWORD',
      { password: passwordInput }
    );

    if (response.success && response.data?.valid) {
      setShowPasswordPrompt(false);
      setPasswordInput('');
      setPasswordError(null);
      await executeEmergencyUnlock();
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const getHostname = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const getRemainingTime = (): string => {
    if (!timerState) return '--:--';
    if (timerState.mode === 'indefinite') return 'Until you stop';
    return formatTime(timerState.remainingSeconds);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zovo-black via-zovo-bg-secondary to-zovo-black flex flex-col items-center justify-center p-8 text-center">
      {/* Logo */}
      <div className="mb-8">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto">
          <rect width="80" height="80" rx="20" fill="#7C3AED" />
          <circle cx="40" cy="40" r="20" fill="none" stroke="white" strokeWidth="4" />
          <circle cx="40" cy="40" r="6" fill="white" />
        </svg>
      </div>

      {/* Main Message */}
      <h1 className="text-4xl font-bold text-zovo-text-primary mb-4">
        Stay Focused
      </h1>

      <p className="text-xl text-zovo-text-secondary mb-2">
        This site is blocked during your focus session
      </p>

      {blockedUrl && (
        <p className="text-sm text-zovo-text-muted mb-8">
          {getHostname(blockedUrl)}
        </p>
      )}

      {/* Timer */}
      {settings?.blockedPage.showTimer && timerState && timerState.status !== 'idle' && (
        <div className="mb-8">
          <div className="text-6xl font-bold text-zovo-violet mb-2 font-mono">
            {getRemainingTime()}
          </div>
          <p className="text-sm text-zovo-text-muted">
            {timerState.status === 'focusing' ? 'remaining in focus session' : 'break time'}
          </p>
        </div>
      )}

      {/* Pomodoro Progress */}
      {timerState && timerState.mode === 'pomodoro' && (
        <div className="flex gap-2 justify-center mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${
                i < timerState.pomodoroCount % 4
                  ? 'bg-focus-green'
                  : 'bg-zovo-bg-tertiary'
              }`}
            />
          ))}
        </div>
      )}

      {/* Motivational Quote */}
      {settings?.blockedPage.showQuote && quote && (
        <div className="max-w-lg mb-12 p-6 bg-zovo-bg-secondary/50 rounded-xl border border-zovo-border">
          <blockquote className="text-lg text-zovo-text-primary italic mb-2">
            "{quote.text}"
          </blockquote>
          <cite className="text-sm text-zovo-text-muted">- {quote.author}</cite>
        </div>
      )}

      {/* Emergency Unlock */}
      {settings?.blockedPage.allowEmergencyUnlock && (
        <div className="mt-8">
          {!showUnlockConfirm ? (
            <button
              onClick={handleEmergencyUnlock}
              className="text-sm text-zovo-text-muted hover:text-zovo-text-secondary transition-colors"
            >
              Need access? Emergency unlock
            </button>
          ) : showPasswordPrompt ? (
            <div className="p-5 bg-zovo-bg-secondary rounded-xl border border-zovo-border max-w-md">
              <h3 className="text-lg font-semibold text-zovo-text-primary mb-1">
                Password Required
              </h3>
              <p className="text-sm text-zovo-text-secondary mb-4">
                Enter your password to unlock this page.
              </p>

              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlockPasswordSubmit();
                  if (e.key === 'Escape') {
                    setShowPasswordPrompt(false);
                    setShowUnlockConfirm(false);
                  }
                }}
                placeholder="Enter password"
                autoFocus
                className="mb-2 w-full rounded-lg border border-zovo-border bg-zovo-bg-primary px-3 py-2 text-sm text-zovo-text-primary placeholder-zovo-text-muted outline-none focus:border-zovo-violet focus:ring-1 focus:ring-zovo-violet"
              />

              {passwordError && (
                <p className="mb-2 text-xs text-zovo-error">{passwordError}</p>
              )}

              <div className="mt-3 flex gap-2 justify-center">
                <button
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    setShowUnlockConfirm(false);
                  }}
                  className="zovo-btn zovo-btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnlockPasswordSubmit}
                  className="zovo-btn zovo-btn-primary text-sm"
                >
                  Unlock
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-zovo-bg-secondary rounded-lg border border-zovo-border max-w-md">
              <p className="text-sm text-zovo-text-secondary mb-4">
                Are you sure? This will end your focus session.
                Emergency unlock has a {settings.blockedPage.emergencyCooldownMinutes} minute cooldown.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowUnlockConfirm(false)}
                  className="zovo-btn zovo-btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmergencyUnlock}
                  className="zovo-btn zovo-btn-danger text-sm"
                >
                  Yes, Unlock
                </button>
              </div>
            </div>
          )}
          {unlockStatus && (
            <p className="mt-4 text-sm text-zovo-warning">{unlockStatus}</p>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="absolute bottom-8 text-center">
        <a
          href="https://zovo.one"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zovo-text-muted hover:text-zovo-violet transition-colors"
        >
          Focus Mode Pro by Zovo
        </a>
      </footer>
    </div>
  );
};

// Mount React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <BlockedPage />
    </React.StrictMode>
  );
}
