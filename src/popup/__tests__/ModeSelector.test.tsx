/**
 * Tests for ModeSelector component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModeSelector from '../components/ModeSelector';
import { DEFAULT_POMODORO } from '../../lib/types';

const mockOnStartFocus = jest.fn();

const defaultProps = {
  currentMode: 'pomodoro' as const,
  customDuration: 60,
  pomodoroSettings: DEFAULT_POMODORO,
  onStartFocus: mockOnStartFocus,
};

describe('ModeSelector Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mode buttons', () => {
    it('should render all three mode options', () => {
      render(<ModeSelector {...defaultProps} />);

      expect(screen.getByText('Pomodoro')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText('Until I Stop')).toBeInTheDocument();
    });

    it('should highlight the currently selected mode', () => {
      render(<ModeSelector {...defaultProps} currentMode="pomodoro" />);

      const pomodoroButton = screen.getByText('Pomodoro').closest('button');
      expect(pomodoroButton).toHaveClass('border-zovo-violet');
    });

    it('should allow selecting different modes', () => {
      render(<ModeSelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Custom'));

      // Custom mode should now be selected and show duration slider
      expect(screen.getByText('Duration')).toBeInTheDocument();
    });
  });

  describe('pomodoro mode', () => {
    it('should display pomodoro settings in description', () => {
      render(<ModeSelector {...defaultProps} />);

      expect(screen.getByText('25min focus, 5min break')).toBeInTheDocument();
    });

    it('should start pomodoro session with correct mode', () => {
      render(<ModeSelector {...defaultProps} />);

      fireEvent.click(screen.getByText(/Start Pomodoro Session/));

      expect(mockOnStartFocus).toHaveBeenCalledWith('pomodoro', undefined);
    });
  });

  describe('custom mode', () => {
    it('should show duration slider when custom is selected', () => {
      render(<ModeSelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Custom'));

      expect(screen.getByRole('slider')).toBeInTheDocument();
      expect(screen.getByText('5 min')).toBeInTheDocument();
      expect(screen.getByText('3 hours')).toBeInTheDocument();
    });

    it('should update duration when slider changes', () => {
      render(<ModeSelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Custom'));

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '90' } });

      expect(screen.getByText('90 min')).toBeInTheDocument();
    });

    it('should start custom session with selected duration', () => {
      render(<ModeSelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Custom'));

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '45' } });

      fireEvent.click(screen.getByText(/Start Custom Session/));

      expect(mockOnStartFocus).toHaveBeenCalledWith('custom', 45);
    });
  });

  describe('indefinite mode', () => {
    it('should display description for indefinite mode', () => {
      render(<ModeSelector {...defaultProps} />);

      expect(screen.getByText('No time limit')).toBeInTheDocument();
    });

    it('should start indefinite session', () => {
      render(<ModeSelector {...defaultProps} />);

      fireEvent.click(screen.getByText('Until I Stop'));
      fireEvent.click(screen.getByText(/Start Until I Stop Session/));

      expect(mockOnStartFocus).toHaveBeenCalledWith('indefinite', undefined);
    });
  });

  describe('start button', () => {
    it('should show correct button text for selected mode', () => {
      render(<ModeSelector {...defaultProps} />);

      expect(screen.getByText(/Start Pomodoro Session/)).toBeInTheDocument();

      fireEvent.click(screen.getByText('Custom'));
      expect(screen.getByText(/Start Custom Session/)).toBeInTheDocument();

      fireEvent.click(screen.getByText('Until I Stop'));
      expect(screen.getByText(/Start Until I Stop Session/)).toBeInTheDocument();
    });
  });
});
