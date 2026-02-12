import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { messaging } from '../lib/messaging';
import { t } from '../lib/i18n';
import { formatTime } from '../lib/types';
import type { TimerState, Settings } from '../lib/types';
import '../popup/styles.css';

interface Quote {
  text: string;
  author: string;
}

const MOTIVATIONAL_QUOTES: Quote[] = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus is the art of knowing what to ignore.", author: "James Clear" },
  { text: "You will never reach your destination if you stop and throw stones at every dog that barks.", author: "Winston Churchill" },
  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Starve your distractions, feed your focus.", author: "Daniel Goleman" },
  { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.", author: "John C. Maxwell" },
];

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
  const [localQuoteIndex, setLocalQuoteIndex] = useState(
    Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  );
  const [quoteFading, setQuoteFading] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  // Entrance animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Rotate local motivational quotes every 10 seconds with fade transition
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteFading(true);
      setTimeout(() => {
        setLocalQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
        setQuoteFading(false);
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
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
      try {
        const timerRes = await messaging.send<void, TimerState>('GET_TIMER_STATE');
        if (timerRes.success && timerRes.data) {
          setTimerState(timerRes.data);

          // If focus mode ended, redirect back
          if (timerRes.data.status === 'idle' && blockedUrl && isSafeUrl(blockedUrl)) {
            window.location.href = blockedUrl;
          }
        }
      } catch {
        // Extension context may be invalidated, ignore
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

  const isSafeUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const executeEmergencyUnlock = async () => {
    const response = await messaging.send<void, { allowed: boolean; reason?: string }>(
      'EMERGENCY_UNLOCK'
    );

    if (response.success && response.data) {
      if (response.data.allowed) {
        setUnlockStatus(t('blkUnlocking'));
        setTimeout(() => {
          if (blockedUrl && isSafeUrl(blockedUrl)) {
            window.location.href = blockedUrl;
          }
        }, 1000);
      } else {
        setUnlockStatus(response.data.reason ?? t('errUnableToUnlock'));
        setShowUnlockConfirm(false);
        setShowPasswordPrompt(false);
      }
    }
  };

  const handleUnlockPasswordSubmit = async () => {
    if (!passwordInput.trim()) {
      setPasswordError(t('errEnterPassword'));
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
      setPasswordError(t('errIncorrectPassword'));
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
    if (timerState.mode === 'indefinite') return t('blkUntilYouStop');
    return formatTime(timerState.remainingSeconds);
  };

  const getElapsedTime = (): string | null => {
    if (!timerState || timerState.status === 'idle') return null;
    if (timerState.mode === 'indefinite') return null;
    const elapsedSeconds = Math.max(0, timerState.totalSeconds - timerState.remainingSeconds);
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 1) return 'Just started';
    if (minutes === 1) return '1 minute focused';
    if (minutes < 60) return `${minutes} minutes focused`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (hours === 1 && remainingMins === 0) return '1 hour focused';
    if (remainingMins === 0) return `${hours} hours focused`;
    return `${hours}h ${remainingMins}m focused`;
  };

  const currentLocalQuote = MOTIVATIONAL_QUOTES[localQuoteIndex];
  const elapsedTime = getElapsedTime();

  return (
    <div className="blocked-page-bg min-h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Animated gradient background overlay */}
      <div className="blocked-page-gradient-overlay" />

      {/* Content wrapper with entrance animations */}
      <div
        className="relative z-10 flex flex-col items-center justify-center max-w-2xl mx-auto"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
        }}
      >
        {/* Shield Icon with glow */}
        <div className="blocked-shield-icon mb-10">
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none" className="mx-auto">
            <defs>
              <linearGradient id="shieldGradient" x1="16" y1="8" x2="80" y2="88" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="50%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#5B21B6" />
              </linearGradient>
              <filter id="shieldGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Shield shape */}
            <path
              d="M48 8L16 24V44C16 65.6 29.6 85.6 48 90C66.4 85.6 80 65.6 80 44V24L48 8Z"
              fill="url(#shieldGradient)"
              filter="url(#shieldGlow)"
              opacity="0.9"
            />
            {/* Checkmark inside shield */}
            <path
              d="M38 50L44 56L58 42"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Main Message */}
        <h1
          className="text-5xl font-bold text-zovo-text-primary mb-3 tracking-tight"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.8s ease-out 0.15s, transform 0.8s ease-out 0.15s',
          }}
        >
          {t('stsStayFocused')}
        </h1>

        <p
          className="text-lg text-zovo-text-secondary mb-2"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.8s ease-out 0.25s, transform 0.8s ease-out 0.25s',
          }}
        >
          {t('blkSiteBlocked')}
        </p>

        {blockedUrl && (
          <div
            className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zovo-bg-secondary/60 border border-zovo-border"
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.8s ease-out 0.35s',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-focus-red animate-pulse" />
            <span className="text-sm text-zovo-text-muted">
              {getHostname(blockedUrl)}
            </span>
          </div>
        )}

        {/* Session Progress Section */}
        <div
          className="mb-8"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.8s ease-out 0.4s, transform 0.8s ease-out 0.4s',
          }}
        >
          {/* Timer */}
          {settings?.blockedPage.showTimer && timerState && timerState.status !== 'idle' && (
            <div className="mb-4">
              <div className="text-6xl font-bold text-zovo-violet mb-2 font-mono blocked-timer-glow">
                {getRemainingTime()}
              </div>
              <p className="text-sm text-zovo-text-muted">
                {timerState.status === 'focusing' ? t('blkRemainingFocus') : t('blkBreakTime')}
              </p>
            </div>
          )}

          {/* Elapsed Time */}
          {elapsedTime && (
            <p className="text-sm text-focus-green font-medium mb-2">
              {elapsedTime}
            </p>
          )}
        </div>

        {/* Pomodoro Progress */}
        {timerState && timerState.mode === 'pomodoro' && (
          <div
            className="flex gap-3 justify-center mb-8"
            role="group"
            aria-label={`${timerState.pomodoroCount % 4} of 4 pomodoros in current cycle`}
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.8s ease-out 0.45s',
            }}
          >
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full transition-all duration-300 ${
                  i < timerState.pomodoroCount % 4
                    ? 'bg-focus-green shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                    : 'bg-zovo-bg-tertiary border border-zovo-border-light'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {/* Breathing Exercise Circle */}
        <div
          className="mb-10"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 1.2s ease-out 0.6s',
          }}
        >
          <div className="blocked-breathe-circle">
            <div className="blocked-breathe-circle-inner">
              <span className="text-xs text-zovo-text-muted font-medium tracking-widest uppercase">
                breathe
              </span>
            </div>
          </div>
        </div>

        {/* Motivational Quote - Rotating local quotes */}
        <div
          className="max-w-lg mb-8"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.8s ease-out 0.7s, transform 0.8s ease-out 0.7s',
          }}
        >
          <div
            className="p-6 bg-zovo-bg-secondary/40 rounded-2xl border border-zovo-border/50 backdrop-blur-sm"
            style={{
              opacity: quoteFading ? 0 : 1,
              transition: 'opacity 0.5s ease-in-out',
            }}
          >
            <blockquote className="text-lg text-zovo-text-primary italic mb-3 leading-relaxed">
              &ldquo;{currentLocalQuote.text}&rdquo;
            </blockquote>
            <cite className="text-sm text-zovo-violet font-medium not-italic">
              &mdash; {currentLocalQuote.author}
            </cite>
          </div>
        </div>

        {/* Server-side quote (if settings enable it and it's available) */}
        {settings?.blockedPage.showQuote && quote && (
          <div
            className="max-w-lg mb-8 p-5 bg-zovo-bg-secondary/30 rounded-xl border border-zovo-border/30"
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.8s ease-out 0.8s',
            }}
          >
            <blockquote className="text-base text-zovo-text-secondary italic mb-2">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <cite className="text-xs text-zovo-text-muted not-italic">
              &mdash; {quote.author}
            </cite>
          </div>
        )}

        {/* Go Back Button */}
        <div
          className="mb-6"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.8s ease-out 0.85s, transform 0.8s ease-out 0.85s',
          }}
        >
          <button
            onClick={() => history.back()}
            className="blocked-go-back-btn px-8 py-3 rounded-xl text-base font-semibold text-white transition-all duration-300"
          >
            Return to What Matters
          </button>
        </div>

        {/* Emergency Unlock - intentionally subtle */}
        {settings?.blockedPage.allowEmergencyUnlock && (
          <div
            className="mt-4"
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 1s ease-out 1s',
            }}
          >
            {!showUnlockConfirm ? (
              <button
                onClick={handleEmergencyUnlock}
                className="text-xs text-zovo-text-muted/60 hover:text-zovo-text-muted transition-colors duration-300"
              >
                {t('blkEmergencyUnlock')}
              </button>
            ) : showPasswordPrompt ? (
              <div className="p-5 bg-zovo-bg-secondary/80 rounded-xl border border-zovo-border max-w-md backdrop-blur-sm blocked-fade-in">
                <h3 className="text-lg font-semibold text-zovo-text-primary mb-1">
                  {t('ttlPasswordRequired')}
                </h3>
                <p className="text-sm text-zovo-text-secondary mb-4">
                  {t('blkEnterPasswordUnlock')}
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
                  placeholder={t('plhEnterPassword')}
                  aria-label={t('plhEnterPassword')}
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
                    {t('btnCancel')}
                  </button>
                  <button
                    onClick={handleUnlockPasswordSubmit}
                    className="zovo-btn zovo-btn-primary text-sm"
                  >
                    {t('btnUnlock')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-zovo-bg-secondary/80 rounded-lg border border-zovo-border max-w-md backdrop-blur-sm blocked-fade-in">
                <p className="text-sm text-zovo-text-secondary mb-4">
                  {t('blkConfirmUnlock', [String(settings.blockedPage.emergencyCooldownMinutes)])}
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setShowUnlockConfirm(false)}
                    className="zovo-btn zovo-btn-secondary text-sm"
                  >
                    {t('btnCancel')}
                  </button>
                  <button
                    onClick={handleEmergencyUnlock}
                    className="zovo-btn zovo-btn-danger text-sm"
                  >
                    {t('btnYesUnlock')}
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
        <footer className="mt-16">
          <a
            href="https://zovo.one"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zovo-text-muted/40 hover:text-zovo-violet transition-colors duration-300"
          >
            {t('appNameFull')} {t('lblByZovo')}
          </a>
        </footer>
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
      <BlockedPage />
    </React.StrictMode>
  );
}
