import React, { useRef, useEffect, useState } from 'react';
import { t } from '../../lib/i18n';
import type { TimerState } from '../../lib/types';
import { formatTime } from '../../lib/types';

interface TimerProps {
  timerState: TimerState | null;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onStartBreak: () => void;
  onSkipBreak: () => void;
}

const Timer: React.FC<TimerProps> = ({
  timerState,
  onStart,
  onStop,
  onPause,
  onResume,
  onStartBreak,
  onSkipBreak,
}) => {
  const status = timerState?.status ?? 'idle';
  const mode = timerState?.mode ?? 'pomodoro';
  const remainingSeconds = timerState?.remainingSeconds ?? 0;
  const totalSeconds = timerState?.totalSeconds ?? 0;
  const pomodoroCount = timerState?.pomodoroCount ?? 0;

  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  // Track previous status for mode-switch bounce animation
  const prevStatusRef = useRef(status);
  const [modeBounce, setModeBounce] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // Trigger bounce when switching between focusing and break
    if (
      (prevStatus === 'focusing' && status === 'break') ||
      (prevStatus === 'break' && status === 'focusing')
    ) {
      setModeBounce(true);
      const timer = setTimeout(() => setModeBounce(false), 400);
      return () => clearTimeout(timer);
    }

    // Trigger completion flash when timer reaches 100% and switches to idle/break
    if (prevStatus === 'focusing' && (status === 'break' || status === 'idle')) {
      setShowComplete(true);
      const timer = setTimeout(() => setShowComplete(false), 800);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [status]);

  const getStatusText = () => {
    switch (status) {
      case 'focusing':
        return mode === 'indefinite' ? t('stsFocusing') : t('stsStayFocused');
      case 'break':
        return t('stsTakeBreak');
      case 'paused':
        return t('stsPaused');
      default:
        return t('stsReadyToFocus');
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'focusing':
        return 'text-focus-green';
      case 'break':
        return 'text-focus-orange';
      case 'paused':
        return 'text-zovo-warning';
      default:
        return 'text-zovo-text-secondary';
    }
  };

  const getRingColor = () => {
    switch (status) {
      case 'focusing':
        return '#22C55E';
      case 'break':
        return '#F97316';
      case 'paused':
        return '#F59E0B';
      default:
        return '#7C3AED';
    }
  };

  const getGlowClass = () => {
    switch (status) {
      case 'focusing':
        return 'timer-glow-focusing';
      case 'break':
        return 'timer-glow-break';
      case 'paused':
        return 'timer-glow-paused';
      default:
        return '';
    }
  };

  return (
    <div className="zovo-card text-center">
      {/* Timer Circle */}
      <div
        className={`relative w-40 h-40 mx-auto mb-4 ${modeBounce ? 'timer-mode-bounce' : ''}`}
        role="img"
        aria-label={mode === 'indefinite' && status !== 'idle' ? getStatusText() : `${formatTime(remainingSeconds)} ${getStatusText()}`}
      >
        <svg
          className={`w-full h-full transform -rotate-90 ${getGlowClass()}`}
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-zovo-bg-tertiary"
          />
          {/* Progress circle with smooth tick transition */}
          {status !== 'idle' && mode !== 'indefinite' && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getRingColor()}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="timer-progress-ring"
            />
          )}
          {/* Completion celebration flash circle */}
          {showComplete && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill={getRingColor()}
              fillOpacity="0.3"
              stroke="none"
              className="timer-complete-flash"
            />
          )}
        </svg>

        {/* Timer text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-zovo-text-primary timer-digits">
            {mode === 'indefinite' && status !== 'idle' ? t('lblOn') : formatTime(remainingSeconds)}
          </span>
          <span className={`text-sm ${getStatusColor()}`}>{getStatusText()}</span>
        </div>
      </div>

      {/* Pomodoro count */}
      {mode === 'pomodoro' && (
        <div className="flex justify-center gap-1 mb-4" role="group" aria-label={`${pomodoroCount % 4} of 4 pomodoros in current cycle`}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < pomodoroCount % 4
                  ? 'bg-focus-green'
                  : 'bg-zovo-bg-tertiary'
              }`}
              aria-hidden="true"
            />
          ))}
          <span className="ml-2 text-xs text-zovo-text-muted">
            {status === 'focusing' || status === 'paused' || status === 'break'
              ? `${pomodoroCount > 0 ? pomodoroCount + ' ' + t('lblDone') + ', ' : ''}1 ${t('lblActiveLC')}`
              : `${pomodoroCount} ${t('lblCompleted')}`}
          </span>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex gap-2 justify-center">
        {status === 'idle' && (
          <button
            onClick={onStart}
            className="zovo-btn zovo-btn-primary px-8 py-3"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            {t('btnStartFocus')}
          </button>
        )}

        {status === 'focusing' && (
          <>
            <button
              onClick={onPause}
              className="zovo-btn zovo-btn-secondary"
              title={t('btnPause')}
              aria-label={t('btnPause')}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            </button>
            <button
              onClick={onStop}
              className="zovo-btn zovo-btn-secondary text-zovo-error"
              title={t('btnStop')}
              aria-label={t('btnStop')}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          </>
        )}

        {status === 'paused' && (
          <>
            <button
              onClick={onResume}
              className="zovo-btn zovo-btn-primary"
              title={t('btnResume')}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              {t('btnResume')}
            </button>
            <button
              onClick={onStop}
              className="zovo-btn zovo-btn-secondary text-zovo-error"
              title={t('btnStop')}
              aria-label={t('btnStop')}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          </>
        )}

        {status === 'break' && (
          <>
            <button
              onClick={onSkipBreak}
              className="zovo-btn zovo-btn-primary"
            >
              {t('btnSkipBreak')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Timer;
