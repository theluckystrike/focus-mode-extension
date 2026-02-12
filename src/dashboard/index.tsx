import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import '../popup/styles.css';
import { t } from '../lib/i18n';
import type { UsageStats, DailyStats } from '../lib/types';
import { messaging } from '../lib/messaging';

// ============================================================================
// Types
// ============================================================================

interface DashboardData {
  stats: UsageStats;
  tier: string;
  installedAt: number | null;
  dailyHistory: DailyStats[];
  featureGateAvailable: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatFocusTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function getShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function getLast7Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0] ?? '');
  }
  return days;
}

function calculateAverageSessionDuration(stats: UsageStats): number {
  if (stats.totalSessions === 0) return 0;
  return Math.round(stats.totalFocusTime / stats.totalSessions);
}

function calculateFeatureUsagePercent(tier: string): number {
  // Free users have access to about 60% of features
  return tier === 'free' ? 60 : 100;
}

// ============================================================================
// SVG Icons
// ============================================================================

const Logo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <rect width="56" height="56" rx="14" fill="#7C3AED" />
    <circle cx="28" cy="28" r="14" fill="none" stroke="white" strokeWidth="3.5" />
    <circle cx="28" cy="28" r="7" fill="none" stroke="white" strokeWidth="2.5" />
    <circle cx="28" cy="28" r="2.5" fill="white" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ZapIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const TargetIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const ShieldIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const FlameIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
  </svg>
);

const TrophyIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0012 0V2z" />
  </svg>
);

const TimerIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="2" x2="14" y2="2" />
    <line x1="12" y1="14" x2="12" y2="8" />
    <circle cx="12" cy="14" r="8" />
  </svg>
);

const DownloadIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SettingsIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const ArrowUpRightIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

const SpinnerIcon: React.FC = () => (
  <svg className="animate-spin" width="40" height="40" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="#27272A" strokeWidth="3" />
    <path d="M12 2a10 10 0 019.17 6" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// ============================================================================
// Sub-Components
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  accent?: boolean;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtext, accent, delay = 0 }) => (
  <div
    className={`bg-zovo-bg-secondary rounded-xl p-5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] zovo-slide-up ${
      accent ? 'border-zovo-violet' : 'border-zovo-border'
    }`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    <div className="flex items-center gap-3 mb-3">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-lg ${
          accent ? 'bg-zovo-violet/20 text-zovo-violet' : 'bg-zovo-bg-tertiary text-zovo-text-secondary'
        }`}
      >
        {icon}
      </div>
      <span className="text-sm text-zovo-text-secondary">{label}</span>
    </div>
    <div className="text-2xl font-bold text-zovo-text-primary">{value}</div>
    {subtext && <div className="text-xs text-zovo-text-muted mt-1">{subtext}</div>}
  </div>
);

interface WeeklyChartProps {
  dailyStats: DailyStats[];
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ dailyStats }) => {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const last7 = getLast7Days();

  const dataMap = new Map<string, DailyStats>();
  for (const ds of dailyStats) {
    dataMap.set(ds.date, ds);
  }

  const chartData = last7.map((date) => ({
    date,
    dayLabel: getDayLabel(date),
    shortDate: getShortDate(date),
    focusTime: dataMap.get(date)?.totalFocusTime ?? 0,
    sessions: dataMap.get(date)?.sessionsCompleted ?? 0,
    sitesBlocked: dataMap.get(date)?.sitesBlocked ?? 0,
  }));

  const maxFocusTime = Math.max(...chartData.map((d) => d.focusTime), 1);
  const hasData = chartData.some((d) => d.focusTime > 0);

  if (!hasData) {
    return (
      <div className="bg-zovo-bg-secondary border border-zovo-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-zovo-text-primary mb-4">{t('dashWeeklyActivity')}</h3>
        <div className="flex items-center justify-center h-40 text-zovo-text-muted text-sm">
          {t('dashNoDataYet')}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zovo-bg-secondary border border-zovo-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-zovo-text-primary mb-6">{t('dashWeeklyActivity')}</h3>
      <div className="flex items-end justify-between gap-3 zovo-chart-height">
        {chartData.map((day, dayIndex) => {
          const barHeight = day.focusTime > 0 ? Math.max((day.focusTime / maxFocusTime) * 140, 8) : 4;
          const isToday = day.date === getTodayString();
          const isHovered = hoveredDay === day.date;

          return (
            <div
              key={day.date}
              className="flex flex-col items-center flex-1 relative"
              onMouseEnter={() => setHoveredDay(day.date)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Tooltip */}
              {isHovered && day.focusTime > 0 && (
                <div className="absolute bottom-full mb-2 bg-zovo-bg-tertiary border border-zovo-border rounded-lg px-3 py-2 text-xs whitespace-nowrap z-10 shadow-lg">
                  <div className="text-zovo-text-primary font-semibold">{day.shortDate}</div>
                  <div className="text-zovo-text-secondary mt-1">
                    {t('dashFocused', [formatFocusTime(day.focusTime)])}
                  </div>
                  <div className="text-zovo-text-secondary">
                    {t('dashSessionCount', [String(day.sessions)])}
                  </div>
                  <div className="text-zovo-text-secondary">
                    {t('dashSitesBlockedCount', [String(day.sitesBlocked)])}
                  </div>
                </div>
              )}

              {/* Bar */}
              <div
                className={`w-full rounded-t-md transition-all duration-200 cursor-pointer zovo-chart-bar zovo-bar-grow ${
                  day.focusTime > 0
                    ? isHovered
                      ? 'bg-zovo-violet'
                      : 'bg-zovo-violet/70'
                    : 'bg-zovo-bg-tertiary'
                }`}
                style={{ height: `${barHeight}px`, animationDelay: `${dayIndex * 80}ms`, animationFillMode: 'both' }}
              />

              {/* Label */}
              <div
                className={`text-xs mt-2 ${
                  isToday ? 'text-zovo-violet font-semibold' : 'text-zovo-text-muted'
                }`}
              >
                {day.dayLabel}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zovo-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-zovo-violet/70" />
          <span className="text-xs text-zovo-text-muted">{t('dashFocusTimeMinutes')}</span>
        </div>
      </div>
    </div>
  );
};

interface FocusStatsBreakdownProps {
  stats: UsageStats;
}

const FocusStatsBreakdown: React.FC<FocusStatsBreakdownProps> = ({ stats }) => {
  const avgDuration = calculateAverageSessionDuration(stats);

  const items = [
    {
      icon: <FlameIcon />,
      label: t('dashCurrentStreak'),
      value: t('dashDays', [String(stats.currentStreak)]),
      color: 'text-zovo-warning',
      bgColor: 'bg-zovo-warning/15',
    },
    {
      icon: <TrophyIcon />,
      label: t('dashLongestStreak'),
      value: t('dashDays', [String(stats.longestStreak)]),
      color: 'text-zovo-violet',
      bgColor: 'bg-zovo-violet/15',
    },
    {
      icon: <TimerIcon />,
      label: t('dashPomodorosCompleted'),
      value: `${stats.totalPomodorosCompleted}`,
      color: 'text-zovo-success',
      bgColor: 'bg-zovo-success/15',
    },
    {
      icon: <ClockIcon />,
      label: t('dashAvgSessionDuration'),
      value: formatFocusTime(avgDuration),
      color: 'text-zovo-info',
      bgColor: 'bg-zovo-info/15',
    },
  ];

  return (
    <div className="bg-zovo-bg-secondary border border-zovo-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-zovo-text-primary mb-4">{t('dashFocusStats')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-3 bg-zovo-bg-primary rounded-lg transition-all duration-200 hover:bg-zovo-bg-tertiary/50 zovo-slide-up"
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${item.bgColor} ${item.color}`}>
              {item.icon}
            </div>
            <div>
              <div className="text-xs text-zovo-text-muted">{item.label}</div>
              <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface UpgradeCTAProps {
  tier: string;
  featurePercent: number;
}

const UpgradeCTA: React.FC<UpgradeCTAProps> = ({ tier, featurePercent }) => {
  if (tier !== 'free') return null;

  const handleUpgrade = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('upgrade.html') });
  };

  return (
    <div className="relative overflow-hidden rounded-xl p-8 text-center zovo-cta-gradient">
      <h3 className="text-xl font-bold text-zovo-text-primary mb-2">
        {t('dashGetMore')}
      </h3>
      <p className="text-sm text-zovo-text-secondary mb-6 max-w-lg mx-auto">
        {t('dashGetMoreDesc', [String(featurePercent)])}
      </p>
      <button
        onClick={handleUpgrade}
        className="inline-flex items-center gap-2 px-8 py-3 bg-zovo-violet hover:bg-zovo-violet-hover text-white font-semibold rounded-xl transition-all duration-200 shadow-zovo-glow zovo-cta-pulse active:scale-[0.98]"
      >
        {t('btnUpgradePro')}
        <ArrowUpRightIcon />
      </button>
    </div>
  );
};

// ============================================================================
// Dashboard Page
// ============================================================================

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Load all data in parallel
        const [statsResponse, tierResponse, storageResult, featureGateResponse] = await Promise.all([
          messaging.send<undefined, UsageStats>('GET_STATS'),
          messaging.send<undefined, { tier: string }>('GET_TIER'),
          new Promise<{ dailyHistory?: DailyStats[]; installedAt?: number }>((resolve) => {
            chrome.storage.local.get(['dailyHistory', 'installedAt'], (result) => {
              if (chrome.runtime.lastError) {
                resolve({});
                return;
              }
              resolve(result as { dailyHistory?: DailyStats[]; installedAt?: number });
            });
          }),
          messaging.send<{ featureId: string }, { allowed: boolean }>(
            'CHECK_FEATURE_GATE',
            { featureId: 'advanced_stats' }
          ),
        ]);

        const stats: UsageStats = statsResponse.success && statsResponse.data
          ? statsResponse.data
          : {
              totalFocusTime: 0,
              totalSessions: 0,
              totalSitesBlocked: 0,
              totalPomodorosCompleted: 0,
              currentStreak: 0,
              longestStreak: 0,
              dailyStats: [],
              sessions: [],
            };

        const tier = tierResponse.success && tierResponse.data
          ? tierResponse.data.tier
          : 'free';

        const installedAt = storageResult.installedAt ?? null;

        // Use dailyHistory from storage if available, otherwise fall back to stats.dailyStats
        const dailyHistory = storageResult.dailyHistory ?? stats.dailyStats;

        const featureGateAvailable = featureGateResponse.success && featureGateResponse.data
          ? featureGateResponse.data.allowed
          : false;

        setData({
          stats,
          tier,
          installedAt,
          dailyHistory,
          featureGateAvailable,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : t('dashFailedLoad');
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleExportStats = useCallback(() => {
    if (!data) return;

    const exportData = {
      exportedAt: new Date().toISOString(),
      stats: data.stats,
      dailyHistory: data.dailyHistory,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus-mode-pro-stats-${getTodayString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  const handleOpenSettings = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zovo-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <SpinnerIcon />
          <p className="text-zovo-text-secondary text-sm">{t('dashLoading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-zovo-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-zovo-error text-lg font-semibold mb-2">{t('dashError')}</p>
          <p className="text-zovo-text-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, tier, installedAt, dailyHistory } = data;
  const today = getTodayString();
  const todayStats = stats.dailyStats.find((d) => d.date === today);
  const sessionsToday = todayStats?.sessionsCompleted ?? 0;
  const featurePercent = calculateFeatureUsagePercent(tier);

  return (
    <div className="min-h-screen bg-zovo-black text-zovo-text-primary">
      {/* ================================================================
          HEADER
          ================================================================ */}
      <header className="border-b border-zovo-border bg-zovo-bg-secondary">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size={40} />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-zovo-text-primary">{t('appNameFull')}</h1>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      tier === 'pro'
                        ? 'bg-zovo-violet/20 text-zovo-violet'
                        : 'bg-zovo-bg-tertiary text-zovo-text-muted'
                    }`}
                  >
                    {tier.toUpperCase()}
                  </span>
                </div>
                {installedAt && (
                  <p className="text-sm text-zovo-text-muted mt-0.5">
                    {t('dashMemberSince', [formatDate(installedAt)])}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportStats}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zovo-bg-tertiary border border-zovo-border text-zovo-text-secondary text-sm rounded-lg hover:bg-zovo-bg-elevated hover:text-zovo-text-primary transition-all duration-150 active:scale-[0.98]"
              >
                <DownloadIcon />
                {t('btnExport')}
              </button>
              <button
                onClick={handleOpenSettings}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zovo-bg-tertiary border border-zovo-border text-zovo-text-secondary text-sm rounded-lg hover:bg-zovo-bg-elevated hover:text-zovo-text-primary transition-all duration-150 active:scale-[0.98]"
              >
                <SettingsIcon />
                {t('btnSettings')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================
          MAIN CONTENT
          ================================================================ */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Value Summary Cards */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-zovo-text-primary mb-4">{t('dashValueSummary')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<ClockIcon />}
              label={t('dashTimeSaved')}
              value={formatFocusTime(stats.totalFocusTime)}
              subtext={t('optTotalFocusTime')}
              accent
              delay={0}
            />
            <StatCard
              icon={<ZapIcon />}
              label={t('dashSessionsToday')}
              value={String(sessionsToday)}
              subtext={todayStats ? t('dashFocused', [formatFocusTime(todayStats.totalFocusTime)]) : t('dashNoSessionsYet')}
              delay={80}
            />
            <StatCard
              icon={<TargetIcon />}
              label={t('optTotalSessions')}
              value={String(stats.totalSessions)}
              subtext={stats.totalSessions > 0 ? t('dashAvgEach', [formatFocusTime(calculateAverageSessionDuration(stats))]) : t('dashGetStarted')}
              delay={160}
            />
            <StatCard
              icon={<ShieldIcon />}
              label={t('optSitesBlocked')}
              value={String(stats.totalSitesBlocked)}
              subtext={t('dashDistractionsPrevented')}
              delay={240}
            />
          </div>
        </section>

        {/* Weekly Activity Chart */}
        <section className="mb-8">
          <WeeklyChart dailyStats={dailyHistory} />
        </section>

        {/* Focus Stats Breakdown */}
        <section className="mb-8">
          <FocusStatsBreakdown stats={stats} />
        </section>

        {/* Upgrade CTA (free users only) */}
        <section className="mb-8">
          <UpgradeCTA tier={tier} featurePercent={featurePercent} />
        </section>
      </main>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="border-t border-zovo-border bg-zovo-bg-secondary">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={handleExportStats}
                className="inline-flex items-center gap-1.5 text-sm text-zovo-text-muted hover:text-zovo-violet transition-colors"
              >
                <DownloadIcon />
                {t('dashExportStats')}
              </button>
              <button
                onClick={handleOpenSettings}
                className="inline-flex items-center gap-1.5 text-sm text-zovo-text-muted hover:text-zovo-violet transition-colors"
              >
                <SettingsIcon />
                {t('btnBackToSettings')}
              </button>
            </div>
            <p className="text-xs text-zovo-text-muted">
              {t('appNameFull')} v1.0.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ============================================================================
// Mount
// ============================================================================

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <DashboardPage />
    </React.StrictMode>
  );
}
