import React from 'react';
import { t } from '../../lib/i18n';
import type { UsageStats } from '../../lib/types';
import { formatMinutes, getTodayString } from '../../lib/types';

interface QuickStatsProps {
  stats: UsageStats;
}

const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
  const today = getTodayString();
  const todayStats = stats.dailyStats.find(d => d.date === today);

  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="zovo-card text-center py-3">
        <div className="text-lg font-bold text-focus-green">
          {formatMinutes(todayStats?.totalFocusTime ?? 0)}
        </div>
        <div className="text-xs text-zovo-text-muted">{t('lblToday')}</div>
      </div>

      <div className="zovo-card text-center py-3">
        <div className="text-lg font-bold text-zovo-text-primary">
          {todayStats?.sessionsCompleted ?? 0}
        </div>
        <div className="text-xs text-zovo-text-muted">{t('lblSessions')}</div>
      </div>

      <div className="zovo-card text-center py-3">
        <div className="text-lg font-bold text-zovo-violet">
          {todayStats?.sitesBlocked ?? 0}
        </div>
        <div className="text-xs text-zovo-text-muted">{t('lblBlocked')}</div>
      </div>

      <div className="zovo-card text-center py-3">
        <div className="text-lg font-bold text-zovo-warning">
          {stats.currentStreak}
        </div>
        <div className="text-xs text-zovo-text-muted">{t('lblDayStreak')}</div>
      </div>
    </div>
  );
};

export default QuickStats;
