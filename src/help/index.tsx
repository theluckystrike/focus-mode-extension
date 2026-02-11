import React from 'react';
import { createRoot } from 'react-dom/client';
import '../popup/styles.css';

const tips = [
  {
    title: 'Getting Started',
    icon: '\u{1F680}',
    items: [
      'Click the Focus Mode Pro icon in your toolbar to open the popup',
      'Choose a timer mode: Pomodoro (intervals with breaks), Custom (your own duration), or Indefinite (until you stop)',
      'Hit "Start Focus" and all sites in your blocklist will be redirected to a motivational blocked page',
      'Your session progress appears as a badge on the extension icon',
    ],
  },
  {
    title: 'Blocking Websites',
    icon: '\u{1F6E1}\uFE0F',
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
    icon: '\u{1F345}',
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
    icon: '\u2328\uFE0F',
    items: [
      'Press Alt+Shift+F to instantly toggle focus mode from any tab',
      'No need to open the popup. Perfect for quickly entering focus mode',
      'Works even when you are on a different website or tab',
    ],
  },
  {
    title: 'Schedule Mode',
    icon: '\u{1F4C5}',
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
    icon: '\u{1F512}',
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
    icon: '\u{1F4C8}',
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
    icon: '\u{1F527}',
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
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">{section.icon}</span>
                {section.title}
              </h2>
              <ul className="space-y-2">
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
