import React from 'react';
import { createRoot } from 'react-dom/client';
import '../popup/styles.css';

const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zovo-violet/20 text-zovo-violet shrink-0">
    {children}
  </span>
);

const tips = [
  {
    title: 'Getting Started',
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </Icon>
    ),
    items: [
      'Click the Focus Mode Pro icon in your toolbar to open the popup',
      'Choose a timer mode: Pomodoro (intervals with breaks), Custom (your own duration), or Indefinite (until you stop)',
      'Hit "Start Focus" and all sites in your blocklist will be redirected to a motivational blocked page',
      'Your session progress appears as a badge on the extension icon',
    ],
  },
  {
    title: 'Blocking Websites',
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </Icon>
    ),
    items: [
      'Go to Settings > Blocking to manage your blocked sites',
      'Toggle category presets (Social Media, News, Entertainment, Shopping, Gaming) for quick setup',
      'Add custom sites using domain patterns like "facebook.com" or wildcards like "*.reddit.com"',
      'Use the Whitelist to keep important sites (Google Docs, GitHub, etc.) always accessible',
      'Enable Regex mode for advanced pattern matching on custom entries',
    ],
  },
  {
    title: 'The Pomodoro Technique',
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </Icon>
    ),
    items: [
      'Work in focused 25-minute intervals, then take a 5-minute break',
      'After 4 sessions, reward yourself with a longer 15-minute break',
      'This rhythm prevents burnout while maintaining deep concentration',
      'Customize all timings in Settings > General > Pomodoro Timer',
      'Enable "Auto-start breaks" and "Auto-start focus" for a hands-free workflow',
    ],
  },
  {
    title: 'Keyboard Shortcuts',
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
          <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10" />
        </svg>
      </Icon>
    ),
    items: [
      'Press Alt+Shift+F to instantly toggle focus mode from any tab',
      'No need to open the popup. Perfect for quickly entering focus mode',
      'Works even when you are on a different website or tab',
    ],
  },
  {
    title: 'Schedule Mode',
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </Icon>
    ),
    items: [
      'Set up automatic focus hours in Settings > Schedule',
      'Choose which days of the week to activate (Monday through Friday by default)',
      'Set your preferred start and end times for focused work',
      'The extension handles starting and stopping automatically. No manual input needed',
      'Great for establishing a consistent work routine',
    ],
  },
  {
    title: 'Password Protection',
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </Icon>
    ),
    items: [
      'Lock your focus session so you cannot easily quit early',
      'Set a password in Settings > Advanced > Password Protection',
      'Once set, stopping or pausing requires entering your password',
      'Makes it much harder to give in to the temptation of checking blocked sites',
      'Emergency unlock remains available with a cooldown for genuine needs',
    ],
  },
  {
    title: 'Building Better Habits',
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </Icon>
    ),
    items: [
      'Start small with 25-minute sessions before trying longer durations',
      'Block your biggest time-wasters first. Social media and news are common culprits',
      'Check your Stats tab regularly to track your improvement over time',
      'Build a daily streak. Consecutive days of focus builds momentum and discipline',
      'The blocked page shows motivational quotes to keep you inspired',
      'Celebrate milestones. Even a 3-day streak is an achievement worth acknowledging',
    ],
  },
  {
    title: 'Troubleshooting',
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
      </Icon>
    ),
    items: [
      'Site not being blocked? Make sure focus mode is active AND the site is in your blocklist or an enabled category',
      'Site blocked that should not be? Add it to the Whitelist in Settings > Blocking',
      'Timer seems off after Chrome restart? The extension automatically restores your session state',
      'Want a fresh start? Clear extension data from chrome://extensions to reset everything',
      'Need help? Contact us at support@zovo.one',
    ],
  },
];

const HelpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-zovo-black text-zovo-text-primary">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#7C3AED" />
              <circle cx="20" cy="20" r="10" fill="none" stroke="white" strokeWidth="3" />
              <circle cx="20" cy="20" r="3" fill="white" />
            </svg>
            <div>
              <h1 className="text-2xl font-semibold">Focus Mode Pro</h1>
              <p className="text-zovo-text-secondary">Tips & Tricks</p>
            </div>
          </div>
          <button
            onClick={() => chrome.tabs.create({ url: 'options.html' })}
            className="zovo-btn zovo-btn-secondary text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Settings
          </button>
        </div>

        {/* Intro */}
        <div className="zovo-card mb-6">
          <p className="text-zovo-text-secondary">
            Welcome to Focus Mode Pro! Here you will find everything you need to get the most out of your focus sessions.
            Whether you are just getting started or looking for advanced tips, this guide has you covered.
          </p>
        </div>

        {/* Tips Grid */}
        <div className="space-y-4">
          {tips.map((section) => (
            <div key={section.title} className="zovo-card">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-3">
                {section.icon}
                {section.title}
              </h2>
              <ul className="space-y-2 ml-11">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zovo-text-secondary">
                    <span className="text-zovo-violet mt-0.5 shrink-0">&#8226;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-zovo-text-muted">
          <p>
            Focus Mode Pro by{' '}
            <a href="https://zovo.one" target="_blank" rel="noopener noreferrer" className="text-zovo-violet hover:underline">
              Zovo
            </a>
            {' '} | {' '}
            <a href="mailto:support@zovo.one" className="text-zovo-violet hover:underline">
              support@zovo.one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <HelpPage />
    </React.StrictMode>
  );
}
