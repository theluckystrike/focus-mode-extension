/**
 * Tests for Footer component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../components/Footer';

describe('Footer Component', () => {
  describe('basic rendering', () => {
    it('should render "Built by Zovo" text', () => {
      render(<Footer />);

      expect(screen.getByText('Built by')).toBeInTheDocument();
      expect(screen.getByText('Zovo')).toBeInTheDocument();
    });

    it('should render link to zovo.one', () => {
      render(<Footer />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://zovo.one');
    });

    it('should open link in new tab', () => {
      render(<Footer />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('version display', () => {
    it('should display version when provided', () => {
      render(<Footer version="1.0.0" />);

      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    it('should not display version when not provided', () => {
      render(<Footer />);

      expect(screen.queryByText(/^v\d/)).not.toBeInTheDocument();
    });

    it('should display separator when version is provided', () => {
      render(<Footer version="2.1.3" />);

      expect(screen.getByText('|')).toBeInTheDocument();
    });
  });
});
