import React from 'react';
import type { UsageStats } from '../../lib/types';
import { formatMinutes, getTodayString } from '../../lib/types';

interface QuickStatsProps {
  stats: UsageStats;
}

const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
  const today = getTodayString();
  const todayStats = stats.dailyStats.find(d => d.date === today);

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="zovo-card text-center py-3">
        <div className="text-lg font-bold text-focus-green">
          {formatMinutes(todayStats?.totalFocusTime ?? 0)}
        </div>
        <div className="text-xs text-zovo-text-muted">Today</div>
      </div>

      <div className="zovo-card text-center py-3">
        <div className="text-lg font-bold text-zovo-violet">
          {todayStats?.sitesBlocked ?? 0}
        </div>
        <div className="text-xs text-zovo-text-muted">Blocked</div>
      </div>

      <div className="zovo-card text-center py-3">
        <div className="text-lg font-bold text-zovo-warning">
          {stats.currentStreak}
        </div>
        <div className="text-xs text-zovo-text-muted">Day Streak</div>
      </div>
    </div>
  );
};

export default QuickStats;
