/**
 * Tests for Timer component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Timer from '../components/Timer';
import type { TimerState } from '../../lib/types';

const mockTimerState: TimerState = {
  status: 'idle',
  mode: 'pomodoro',
  remainingSeconds: 1500,
  totalSeconds: 1500,
  pomodoroCount: 0,
  sessionsUntilLongBreak: 4,
};

const mockHandlers = {
  onStart: jest.fn(),
  onStop: jest.fn(),
  onPause: jest.fn(),
  onResume: jest.fn(),
  onStartBreak: jest.fn(),
  onSkipBreak: jest.fn(),
};

describe('Timer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('idle state', () => {
    it('should render start button when idle', () => {
      render(<Timer timerState={mockTimerState} {...mockHandlers} />);

      expect(screen.getByText('Start Focus')).toBeInTheDocument();
      expect(screen.getByText('Ready to Focus')).toBeInTheDocument();
    });

    it('should call onStart when start button is clicked', () => {
      render(<Timer timerState={mockTimerState} {...mockHandlers} />);

      fireEvent.click(screen.getByText('Start Focus'));

      expect(mockHandlers.onStart).toHaveBeenCalledTimes(1);
    });

    it('should display formatted time', () => {
      render(<Timer timerState={mockTimerState} {...mockHandlers} />);

      expect(screen.getByText('25:00')).toBeInTheDocument();
    });
  });

  describe('focusing state', () => {
    const focusingState: TimerState = {
      ...mockTimerState,
      status: 'focusing',
      remainingSeconds: 1200,
    };

    it('should show pause and stop buttons when focusing', () => {
      render(<Timer timerState={focusingState} {...mockHandlers} />);

      expect(screen.queryByText('Start Focus')).not.toBeInTheDocument();
      expect(screen.getByTitle('Pause')).toBeInTheDocument();
      expect(screen.getByTitle('Stop')).toBeInTheDocument();
    });

    it('should display "Stay Focused" text', () => {
      render(<Timer timerState={focusingState} {...mockHandlers} />);

      expect(screen.getByText('Stay Focused')).toBeInTheDocument();
    });

    it('should call onPause when pause button is clicked', () => {
      render(<Timer timerState={focusingState} {...mockHandlers} />);

      fireEvent.click(screen.getByTitle('Pause'));

      expect(mockHandlers.onPause).toHaveBeenCalledTimes(1);
    });

    it('should call onStop when stop button is clicked', () => {
      render(<Timer timerState={focusingState} {...mockHandlers} />);

      fireEvent.click(screen.getByTitle('Stop'));

      expect(mockHandlers.onStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('paused state', () => {
    const pausedState: TimerState = {
      ...mockTimerState,
      status: 'paused',
      remainingSeconds: 1000,
    };

    it('should show resume and stop buttons when paused', () => {
      render(<Timer timerState={pausedState} {...mockHandlers} />);

      expect(screen.getByText('Resume')).toBeInTheDocument();
      expect(screen.getByTitle('Stop')).toBeInTheDocument();
    });

    it('should display "Paused" text', () => {
      render(<Timer timerState={pausedState} {...mockHandlers} />);

      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    it('should call onResume when resume button is clicked', () => {
      render(<Timer timerState={pausedState} {...mockHandlers} />);

      fireEvent.click(screen.getByText('Resume'));

      expect(mockHandlers.onResume).toHaveBeenCalledTimes(1);
    });
  });

  describe('break state', () => {
    const breakState: TimerState = {
      ...mockTimerState,
      status: 'break',
      remainingSeconds: 300,
      totalSeconds: 300,
    };

    it('should show skip break button', () => {
      render(<Timer timerState={breakState} {...mockHandlers} />);

      expect(screen.getByText('Skip Break')).toBeInTheDocument();
    });

    it('should display "Take a Break" text', () => {
      render(<Timer timerState={breakState} {...mockHandlers} />);

      expect(screen.getByText('Take a Break')).toBeInTheDocument();
    });

    it('should call onSkipBreak when skip button is clicked', () => {
      render(<Timer timerState={breakState} {...mockHandlers} />);

      fireEvent.click(screen.getByText('Skip Break'));

      expect(mockHandlers.onSkipBreak).toHaveBeenCalledTimes(1);
    });
  });

  describe('indefinite mode', () => {
    const indefiniteState: TimerState = {
      ...mockTimerState,
      status: 'focusing',
      mode: 'indefinite',
      remainingSeconds: Infinity,
      totalSeconds: Infinity,
    };

    it('should display "ON" for indefinite mode', () => {
      render(<Timer timerState={indefiniteState} {...mockHandlers} />);

      expect(screen.getByText('ON')).toBeInTheDocument();
    });

    it('should display "Focusing..." text', () => {
      render(<Timer timerState={indefiniteState} {...mockHandlers} />);

      expect(screen.getByText('Focusing...')).toBeInTheDocument();
    });
  });

  describe('pomodoro counter', () => {
    it('should display pomodoro progress dots', () => {
      const stateWithPomodoros: TimerState = {
        ...mockTimerState,
        pomodoroCount: 2,
      };

      render(<Timer timerState={stateWithPomodoros} {...mockHandlers} />);

      expect(screen.getByText('2 completed')).toBeInTheDocument();
    });
  });

  describe('null timer state', () => {
    it('should handle null timer state gracefully', () => {
      render(<Timer timerState={null} {...mockHandlers} />);

      expect(screen.getByText('Start Focus')).toBeInTheDocument();
      expect(screen.getByText('Ready to Focus')).toBeInTheDocument();
    });
  });
});
