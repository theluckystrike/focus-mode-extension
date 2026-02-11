/**
 * Tests for Header component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../components/Header';

describe('Header Component', () => {
  describe('basic rendering', () => {
    it('should render the title', () => {
      render(<Header title="Focus Mode" />);

      expect(screen.getByText('Focus Mode')).toBeInTheDocument();
    });

    it('should render the logo', () => {
      render(<Header title="Focus Mode" />);

      // SVG should be present
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('settings button', () => {
    it('should render settings button when handler is provided', () => {
      const mockClick = jest.fn();
      render(<Header title="Focus Mode" onSettingsClick={mockClick} />);

      expect(screen.getByTitle('Settings')).toBeInTheDocument();
    });

    it('should not render settings button when handler is not provided', () => {
      render(<Header title="Focus Mode" />);

      expect(screen.queryByTitle('Settings')).not.toBeInTheDocument();
    });

    it('should call handler when settings button is clicked', () => {
      const mockClick = jest.fn();
      render(<Header title="Focus Mode" onSettingsClick={mockClick} />);

      fireEvent.click(screen.getByTitle('Settings'));

      expect(mockClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('badge', () => {
    it('should render badge when provided', () => {
      render(<Header title="Focus Mode" badge="ACTIVE" />);

      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('should not render badge when not provided', () => {
      render(<Header title="Focus Mode" />);

      expect(screen.queryByText('ACTIVE')).not.toBeInTheDocument();
    });

    it('should apply animation class to badge', () => {
      render(<Header title="Focus Mode" badge="ACTIVE" />);

      const badge = screen.getByText('ACTIVE');
      expect(badge).toHaveClass('animate-pulse');
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on settings button', () => {
      render(<Header title="Focus Mode" onSettingsClick={jest.fn()} />);

      const button = screen.getByRole('button', { name: 'Settings' });
      expect(button).toBeInTheDocument();
    });
  });
});
