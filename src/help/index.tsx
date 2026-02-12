import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { t } from '../lib/i18n';
import '../popup/styles.css';

const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zovo-violet/20 text-zovo-violet shrink-0">
    {children}
  </span>
);

/* Small inline icons used next to individual tip items for visual variety */
const TipIcon: React.FC<{ type: 'check' | 'lightbulb' | 'star' | 'arrow' | 'info' | 'key' | 'clock' | 'shield' }> = ({ type }) => {
  const icons: Record<string, React.ReactNode> = {
    check: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    lightbulb: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
      </svg>
    ),
    star: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    arrow: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    info: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    key: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
    clock: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    shield: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  };

  return (
    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zovo-violet/10 text-zovo-violet shrink-0 mt-0.5">
      {icons[type]}
    </span>
  );
};

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform duration-300 ${expanded ? 'rotate-180' : 'rotate-0'}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

type TipIconType = 'check' | 'lightbulb' | 'star' | 'arrow' | 'info' | 'key' | 'clock' | 'shield';

interface TipSection {
  title: string;
  icon: React.ReactNode;
  tipIcon: TipIconType;
  items: string[];
}

const getTips = (): TipSection[] => [
  {
    title: t('helpGettingStarted'),
    icon: (
      <Icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </Icon>
    ),
    tipIcon: 'arrow',
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
    tipIcon: 'shield',
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
    tipIcon: 'clock',
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
    tipIcon: 'key',
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
    tipIcon: 'check',
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
    tipIcon: 'star',
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
    tipIcon: 'lightbulb',
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
    tipIcon: 'info',
    items: [
      t('helpTS1'),
      t('helpTS2'),
      t('helpTS3'),
      t('helpTS4'),
      t('helpTS5'),
    ],
  },
];

/** Collapsible section that measures its content height for smooth animation */
const CollapsibleSection: React.FC<{
  section: TipSection;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ section, index, isExpanded, onToggle }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [section.items]);

  // Alternate between two subtle background treatments
  const isAlt = index % 2 === 1;

  return (
    <div
      className={`rounded-xl border transition-colors duration-200 ${
        isExpanded
          ? 'border-zovo-violet/30 shadow-lg shadow-zovo-violet/5'
          : 'border-zovo-border hover:border-zovo-border-light'
      } ${isAlt ? 'bg-zovo-bg-secondary' : 'bg-zovo-bg-secondary/80'}`}
    >
      {/* Section Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer group"
      >
        {section.icon}
        <h2 className="text-lg font-semibold flex-1 text-zovo-text-primary group-hover:text-zovo-violet transition-colors duration-200">
          {section.title}
        </h2>
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-zovo-bg-tertiary text-zovo-text-muted group-hover:text-zovo-violet group-hover:bg-zovo-violet/10 transition-all duration-200">
          <ChevronIcon expanded={isExpanded} />
        </span>
      </button>

      {/* Collapsible Content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? `${contentHeight}px` : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="px-4 pb-4">
          {/* Subtle divider between header and content */}
          <div className="border-t border-zovo-border/50 mb-3" />

          <div className="space-y-2.5 ml-11">
            {section.items.map((item, i) => (
              <div
                key={i}
                className={`help-tip-item flex gap-3 text-sm text-zovo-text-secondary rounded-lg p-2 -ml-2 transition-colors duration-150 hover:bg-zovo-bg-tertiary/50`}
              >
                <TipIcon type={section.tipIcon} />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const HelpPage: React.FC = () => {
  const tips = getTips();
  // Default: first section is expanded
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(tips.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const allExpanded = expandedSections.size === tips.length;

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

        {/* Expand/Collapse All Toggle */}
        <div className="flex justify-end mb-3">
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            className="text-xs text-zovo-text-muted hover:text-zovo-violet transition-colors duration-200 flex items-center gap-1.5 cursor-pointer"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {allExpanded ? (
                <>
                  <polyline points="18 15 12 9 6 15" />
                </>
              ) : (
                <>
                  <polyline points="6 9 12 15 18 9" />
                </>
              )}
            </svg>
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>

        {/* Tips - Collapsible Sections */}
        <div className="space-y-3">
          {tips.map((section, index) => (
            <CollapsibleSection
              key={section.title}
              section={section}
              index={index}
              isExpanded={expandedSections.has(index)}
              onToggle={() => toggleSection(index)}
            />
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
