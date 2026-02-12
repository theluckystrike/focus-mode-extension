import React, { useState } from 'react';
import { t } from '../../lib/i18n';
import type { TimerMode, PomodoroConfig } from '../../lib/types';

interface ModeSelectorProps {
  currentMode: TimerMode;
  customDuration: number;
  pomodoroSettings: PomodoroConfig;
  onStartFocus: (mode: TimerMode, duration?: number) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  customDuration,
  pomodoroSettings,
  onStartFocus,
}) => {
  const [selectedMode, setSelectedMode] = useState<TimerMode>(currentMode);
  const [duration, setDuration] = useState(customDuration);

  const modes: { id: TimerMode; label: string; description: string }[] = [
    {
      id: 'pomodoro',
      label: t('lblModePomodoro'),
      description: t('descModePomodoro', [String(pomodoroSettings.focusDuration), String(pomodoroSettings.shortBreakDuration)]),
    },
    {
      id: 'custom',
      label: t('lblModeCustom'),
      description: t('descModeCustom'),
    },
    {
      id: 'indefinite',
      label: t('lblModeIndefinite'),
      description: t('descModeIndefinite'),
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zovo-text-secondary">{t('lblModeFocus')}</h3>

      <div className="grid grid-cols-3 gap-2">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            className={`p-3 rounded-lg border text-center transition-all ${
              selectedMode === mode.id
                ? 'border-zovo-violet bg-zovo-violet/10'
                : 'border-zovo-border bg-zovo-bg-secondary hover:border-zovo-border-light'
            }`}
          >
            <div className="text-sm font-medium text-zovo-text-primary">
              {mode.label}
            </div>
            <div className="text-[10px] text-zovo-text-muted mt-1">
              {mode.description}
            </div>
          </button>
        ))}
      </div>

      {/* Custom duration slider */}
      {selectedMode === 'custom' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zovo-text-secondary">{t('lblDuration')}</span>
            <span className="text-zovo-text-primary font-medium">{t('optMinutes', [String(duration)])}</span>
          </div>
          <input
            type="range"
            min="5"
            max="180"
            step="5"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            aria-label={t('lblDuration')}
            className="w-full h-2 bg-zovo-bg-tertiary rounded-lg appearance-none cursor-pointer accent-zovo-violet"
          />
          <div className="flex justify-between text-xs text-zovo-text-muted">
            <span>{t('lblMinShort', ['5'])}</span>
            <span>{t('lblHoursShort', ['3'])}</span>
          </div>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={() => onStartFocus(selectedMode, selectedMode === 'custom' ? duration : undefined)}
        className="zovo-btn zovo-btn-primary zovo-btn-block py-3"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
        {t('btnStartSession', [modes.find(m => m.id === selectedMode)?.label ?? ''])}
      </button>
    </div>
  );
};

export default ModeSelector;
