/**
 * Tests for QuickStats component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import QuickStats from '../components/QuickStats';
import { DEFAULT_USAGE_STATS } from '../../lib/types';

describe('QuickStats Component', () => {
  describe('with no activity', () => {
    it('should display zeros for empty stats', () => {
      render(<QuickStats stats={DEFAULT_USAGE_STATS} />);

      expect(screen.getByText('0m')).toBeInTheDocument();
      // Both "Blocked" and "Day Streak" show 0, so use getAllByText
      expect(screen.getAllByText('0')).toHaveLength(2);
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Blocked')).toBeInTheDocument();
      expect(screen.getByText('Day Streak')).toBeInTheDocument();
    });
  });

  describe('with activity', () => {
    const today = new Date().toISOString().split('T')[0] ?? '';
    const statsWithActivity = {
      ...DEFAULT_USAGE_STATS,
      currentStreak: 5,
      dailyStats: [{
        date: today,
        totalFocusTime: 90, // 1h 30m
        sessionsCompleted: 4,
        sitesBlocked: 15,
        pomodorosCompleted: 4,
      }],
    };

    it('should display formatted focus time', () => {
      render(<QuickStats stats={statsWithActivity} />);

      expect(screen.getByText('1h 30m')).toBeInTheDocument();
    });

    it('should display sites blocked count', () => {
      render(<QuickStats stats={statsWithActivity} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should display current streak', () => {
      render(<QuickStats stats={statsWithActivity} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('with different time formats', () => {
    const today = new Date().toISOString().split('T')[0] ?? '';

    it('should display minutes for less than an hour', () => {
      const stats = {
        ...DEFAULT_USAGE_STATS,
        dailyStats: [{
          date: today,
          totalFocusTime: 45,
          sessionsCompleted: 2,
          sitesBlocked: 5,
          pomodorosCompleted: 2,
        }],
      };

      render(<QuickStats stats={stats} />);

      expect(screen.getByText('45m')).toBeInTheDocument();
    });

    it('should display hours for 60+ minutes', () => {
      const stats = {
        ...DEFAULT_USAGE_STATS,
        dailyStats: [{
          date: today,
          totalFocusTime: 120,
          sessionsCompleted: 4,
          sitesBlocked: 10,
          pomodorosCompleted: 4,
        }],
      };

      render(<QuickStats stats={stats} />);

      expect(screen.getByText('2h')).toBeInTheDocument();
    });
  });

  describe('labels', () => {
    it('should display all stat labels', () => {
      render(<QuickStats stats={DEFAULT_USAGE_STATS} />);

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Blocked')).toBeInTheDocument();
      expect(screen.getByText('Day Streak')).toBeInTheDocument();
    });
  });
});
