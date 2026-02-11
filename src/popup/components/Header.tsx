import React from 'react';

interface HeaderProps {
  title: string;
  onSettingsClick?: () => void;
  badge?: string;
}

const Header: React.FC<HeaderProps> = ({ title, onSettingsClick, badge }) => {
  return (
    <header className="zovo-header">
      <div className="zovo-header-brand">
        {/* Focus Mode Logo */}
        <div className="flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#7C3AED" />
            <circle cx="12" cy="12" r="6" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="12" cy="12" r="2" fill="white" />
          </svg>
        </div>

        {/* Extension Name */}
        <span className="zovo-header-title">{title}</span>

        {/* Active Badge */}
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full uppercase tracking-wide animate-pulse">
            {badge}
          </span>
        )}
      </div>

      {/* Settings Button */}
      {onSettingsClick && (
        <button
          onClick={onSettingsClick}
          className="zovo-icon-btn"
          aria-label="Settings"
          title="Settings"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      )}
    </header>
  );
};

export default Header;
