import React from 'react';
import { createRoot } from 'react-dom/client';
import { t } from '../lib/i18n';
import '../popup/styles.css';

const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zovo-violet/20 text-zovo-violet shrink-0">
    {children}
  </span>
);

const getTips = () => [
  {
    title: t('helpGettingStarted'),
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </Icon>
    ),
    items: [
      t('helpGS1'),
      t('helpGS2'),
      t('helpGS3'),
      t('helpGS4'),
    ],
  },
  {
    title: t('helpBlockingWebsites'),
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </Icon>
    ),
    items: [
      t('helpBW1'),
      t('helpBW2'),
      t('helpBW3'),
      t('helpBW4'),
      t('helpBW5'),
    ],
  },
  {
    title: t('helpPomodoro'),
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </Icon>
    ),
    items: [
      t('helpPom1'),
      t('helpPom2'),
      t('helpPom3'),
      t('helpPom4'),
      t('helpPom5'),
    ],
  },
  {
    title: t('helpKeyboardShortcuts'),
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
          <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10" />
        </svg>
      </Icon>
    ),
    items: [
      t('helpKB1'),
      t('helpKB2'),
      t('helpKB3'),
    ],
  },
  {
    title: t('helpScheduleMode'),
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
      t('helpSM1'),
      t('helpSM2'),
      t('helpSM3'),
      t('helpSM4'),
      t('helpSM5'),
    ],
  },
  {
    title: t('helpPasswordProtection'),
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </Icon>
    ),
    items: [
      t('helpPP1'),
      t('helpPP2'),
      t('helpPP3'),
      t('helpPP4'),
      t('helpPP5'),
    ],
  },
  {
    title: t('helpBuildingHabits'),
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </Icon>
    ),
    items: [
      t('helpBH1'),
      t('helpBH2'),
      t('helpBH3'),
      t('helpBH4'),
      t('helpBH5'),
      t('helpBH6'),
    ],
  },
  {
    title: t('helpTroubleshooting'),
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
      </Icon>
    ),
    items: [
      t('helpTS1'),
      t('helpTS2'),
      t('helpTS3'),
      t('helpTS4'),
      t('helpTS5'),
    ],
  },
];

const HelpPage: React.FC = () => {
  const tips = getTips();
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
              <h1 className="text-2xl font-semibold">{t('appNameFull')}</h1>
              <p className="text-zovo-text-secondary">{t('optTipsTricks')}</p>
            </div>
          </div>
          <button
            onClick={() => chrome.tabs.create({ url: 'options.html' })}
            className="zovo-btn zovo-btn-secondary text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t('btnBackToSettings')}
          </button>
        </div>

        {/* Intro */}
        <div className="zovo-card mb-6">
          <p className="text-zovo-text-secondary">
            {t('helpIntro')}
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
            {t('appNameFull')} {t('lblByZovo').split('Zovo')[0]}
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
