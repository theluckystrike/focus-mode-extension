import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { openUpgradePage } from '../lib/payments';
import { t } from '../lib/i18n';
import '../popup/styles.css';

// ============================================================================
// Types
// ============================================================================

interface ComparisonRow {
  feature: string;
  free: 'unlimited' | 'limited' | 'pro-only';
  freeLimit?: string;
}

interface LimitInfo {
  feature: string;
  reason: string;
}

// ============================================================================
// Feature Comparison Data
// ============================================================================

const getComparisonData = (): ComparisonRow[] => [
  { feature: t('upgFeatSessions'), free: 'limited', freeLimit: t('upgLimit5Day') },
  { feature: t('upgFeatPomodoro'), free: 'unlimited' },
  { feature: t('upgFeatCustomTimer'), free: 'limited', freeLimit: t('upgLimit3Day') },
  { feature: t('upgFeatCategoryPresets'), free: 'unlimited' },
  { feature: t('upgFeatCustomRules'), free: 'limited', freeLimit: t('upgLimit10Rules') },
  { feature: t('upgFeatRegex'), free: 'pro-only' },
  { feature: t('upgFeatWhitelist'), free: 'limited', freeLimit: t('upgLimit5Rules') },
  { feature: t('upgFeatSchedule'), free: 'pro-only' },
  { feature: t('upgFeatPassword'), free: 'pro-only' },
  { feature: t('upgFeatAnalytics'), free: 'pro-only' },
  { feature: t('upgFeatBreakReminders'), free: 'unlimited' },
  { feature: t('upgFeatQuotes'), free: 'unlimited' },
  { feature: t('upgFeatPrioritySupport'), free: 'pro-only' },
];

// ============================================================================
// Limit Reason Labels
// ============================================================================

function getLimitReasonLabel(feature: string, reason: string): string {
  const labels: Record<string, Record<string, string>> = {
    sessions: {
      daily_limit: t('upgLimitSessions'),
    },
    custom_timer: {
      daily_limit: t('upgLimitCustomTimer'),
    },
    block_rules: {
      max_reached: t('upgLimitBlockRules'),
    },
    whitelist_rules: {
      max_reached: t('upgLimitWhitelistRules'),
    },
    regex: {
      pro_only: t('upgLimitRegex'),
    },
    schedule: {
      pro_only: t('upgLimitSchedule'),
    },
    password: {
      pro_only: t('upgLimitPassword'),
    },
    analytics: {
      pro_only: t('upgLimitAnalytics'),
    },
  };

  return labels[feature]?.[reason] || t('upgLimitGeneric');
}

// ============================================================================
// SVG Icons
// ============================================================================

const Logo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="10" fill="#7C3AED" />
    <circle cx="20" cy="20" r="10" fill="none" stroke="white" strokeWidth="3" />
    <circle cx="20" cy="20" r="3" fill="white" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const AlertIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const StarIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// ============================================================================
// Limit Banner Component
// ============================================================================

const LimitBanner: React.FC<{ limitInfo: LimitInfo }> = ({ limitInfo }) => {
  const message = getLimitReasonLabel(limitInfo.feature, limitInfo.reason);

  return (
    <div className="bg-amber-900/30 border border-amber-600/50 rounded-xl p-4 mb-8">
      <div className="flex items-start gap-3">
        <span className="text-amber-400 shrink-0 mt-0.5">
          <AlertIcon />
        </span>
        <div>
          <p className="text-amber-200 font-medium text-sm">{message}</p>
          <p className="text-amber-300/70 text-xs mt-1">
            {t('upgRemoveLimits')}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Feature Comparison Table Component
// ============================================================================

const ComparisonTable: React.FC = () => {
  const comparisonData = getComparisonData();
  return (
  <div className="bg-zovo-bg-secondary border border-zovo-border rounded-xl overflow-hidden">
    <table className="w-full">
      <thead>
        <tr className="border-b border-zovo-border">
          <th className="text-left px-6 py-4 text-sm font-semibold text-zovo-text-primary">{t('upgFeature')}</th>
          <th className="text-center px-4 py-4 text-sm font-semibold text-zovo-text-secondary w-32">{t('upgFree')}</th>
          <th className="text-center px-4 py-4 text-sm font-semibold text-zovo-violet w-32">
            <span className="inline-flex items-center gap-1.5">
              <StarIcon />
              {t('lblPro')}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        {comparisonData.map((row, index) => (
          <tr
            key={row.feature}
            className={index < comparisonData.length - 1 ? 'border-b border-zovo-border/50' : ''}
          >
            <td className="px-6 py-3.5 text-sm text-zovo-text-primary">{row.feature}</td>
            <td className="text-center px-4 py-3.5">
              {row.free === 'unlimited' && (
                <span className="inline-flex items-center justify-center text-focus-green">
                  <CheckIcon />
                </span>
              )}
              {row.free === 'limited' && (
                <span className="text-xs text-zovo-warning font-medium">
                  {row.freeLimit || t('upgLimited')}
                </span>
              )}
              {row.free === 'pro-only' && (
                <span className="inline-flex items-center justify-center text-zovo-text-muted">
                  <XIcon />
                </span>
              )}
            </td>
            <td className="text-center px-4 py-3.5">
              <span className="inline-flex items-center justify-center gap-1.5 text-focus-green">
                <CheckIcon />
                <span className="text-xs font-medium">{t('upgUnlimited')}</span>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  );
};

// ============================================================================
// Pricing Card Component
// ============================================================================

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  badge?: string;
  savings?: string;
  features: string[];
  featured: boolean;
  onUpgrade: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  period,
  badge,
  savings,
  features,
  featured,
  onUpgrade,
}) => (
  <div
    className={`relative rounded-xl p-6 border transition-all ${
      featured
        ? 'border-zovo-violet bg-zovo-bg-secondary shadow-zovo-glow'
        : 'border-zovo-border bg-zovo-bg-secondary hover:border-zovo-border-light'
    }`}
  >
    {badge && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-zovo-violet text-white text-xs font-semibold">
          {badge}
        </span>
      </div>
    )}

    <div className="text-center mb-6">
      <h3 className="text-lg font-semibold text-zovo-text-primary mb-2">{title}</h3>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-3xl font-bold text-zovo-text-primary">{price}</span>
        <span className="text-sm text-zovo-text-muted">{period}</span>
      </div>
      {savings && (
        <p className="text-xs text-focus-green font-medium mt-1">{savings}</p>
      )}
    </div>

    <ul className="space-y-3 mb-6">
      {features.map((feature) => (
        <li key={feature} className="flex items-center gap-2.5 text-sm text-zovo-text-secondary">
          <span className="text-focus-green shrink-0">
            <CheckIcon />
          </span>
          {feature}
        </li>
      ))}
    </ul>

    <button
      onClick={onUpgrade}
      className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
        featured
          ? 'bg-zovo-violet hover:bg-zovo-violet-hover text-white shadow-zovo-glow'
          : 'bg-zovo-bg-tertiary hover:bg-zovo-bg-elevated text-zovo-text-primary border border-zovo-border'
      }`}
    >
      {featured ? t('btnGetAnnualPlan') : t('btnGetMonthlyPlan')}
    </button>
  </div>
);

// ============================================================================
// Upgrade Page Component
// ============================================================================

const UpgradePage: React.FC = () => {
  const [limitInfo, setLimitInfo] = useState<LimitInfo | null>(null);

  useEffect(() => {
    // Parse URL params for limit context
    const params = new URLSearchParams(window.location.search);
    const feature = params.get('feature');
    const reason = params.get('reason');

    if (feature && reason) {
      setLimitInfo({ feature, reason });
    }
  }, []);

  const handleMonthlyUpgrade = () => {
    openUpgradePage('upgrade-monthly');
  };

  const handleAnnualUpgrade = () => {
    openUpgradePage('upgrade-annual');
  };

  const handleOpenAccount = () => {
    try {
      chrome.tabs.create({ url: 'options.html#account' });
    } catch {
      // Fallback if chrome API is unavailable
      window.location.href = 'options.html#account';
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  };

  return (
    <div className="min-h-screen bg-zovo-black text-zovo-text-primary">
      {/* ================================================================
          HEADER SECTION
          ================================================================ */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 zovo-hero-gradient" />
        <div className="absolute inset-0 zovo-hero-gradient-overlay" />

        <div className="relative max-w-4xl mx-auto px-8 pt-16 pb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            <Logo size={48} />
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">{t('appNameFull')}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-zovo-violet/20 text-zovo-violet text-xs font-bold uppercase tracking-wide border border-zovo-violet/30">
                {t('lblPro')}
              </span>
            </div>
          </div>
          <p className="text-lg text-zovo-text-secondary max-w-xl mx-auto leading-relaxed">
            {t('upgUnlockPower')}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-8 pb-16">
        {/* ================================================================
            LIMIT BANNER (conditional)
            ================================================================ */}
        {limitInfo && <LimitBanner limitInfo={limitInfo} />}

        {/* ================================================================
            FEATURE COMPARISON TABLE
            ================================================================ */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-center mb-2">{t('upgFreeVsPro')}</h2>
          <p className="text-zovo-text-secondary text-center mb-6 text-sm">
            {t('upgSeeWhatYouGet')}
          </p>
          <ComparisonTable />
        </section>

        {/* ================================================================
            PRICING CARDS
            ================================================================ */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-center mb-2">{t('upgChoosePlan')}</h2>
          <p className="text-zovo-text-secondary text-center mb-8 text-sm">
            {t('upgCancelAnytime')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <PricingCard
              title={t('upgMonthly')}
              price="$4.99"
              period={t('upgPerMonth')}
              features={[
                t('upgAllProFeatures'),
                t('upgUnlimitedUsage'),
                t('upgPrioritySupport'),
                t('upgCancelAnytimeShort'),
              ]}
              featured={false}
              onUpgrade={handleMonthlyUpgrade}
            />
            <PricingCard
              title={t('upgAnnual')}
              price="$3.99"
              period={t('upgPerMonth')}
              badge={t('upgBestValue')}
              savings={t('upgSavings')}
              features={[
                t('upgAllProFeatures'),
                t('upgUnlimitedUsage'),
                t('upgPrioritySupport'),
                t('upgTwoMonthsFree'),
              ]}
              featured={true}
              onUpgrade={handleAnnualUpgrade}
            />
          </div>
        </section>

        {/* ================================================================
            SOCIAL PROOF
            ================================================================ */}
        <section className="mb-12">
          <div className="bg-zovo-bg-secondary border border-zovo-border rounded-xl p-8 text-center">
            <p className="text-lg text-zovo-text-secondary italic leading-relaxed">
              &ldquo;{t('upgTestimonial')}&rdquo;
            </p>
            <p className="text-sm text-zovo-text-muted mt-3">
              &mdash; {t('upgTestimonialAuthor')}
            </p>
          </div>
        </section>

        {/* ================================================================
            FOOTER
            ================================================================ */}
        <footer className="text-center space-y-3">
          <p className="text-sm text-zovo-text-secondary">
            {t('upgAlreadyHaveLicense')}{' '}
            <button
              onClick={handleOpenAccount}
              className="text-zovo-violet hover:underline font-medium"
            >
              {t('upgActivateHere')}
            </button>
          </p>
          <p>
            <button
              onClick={handleBack}
              className="text-sm text-zovo-text-muted hover:text-zovo-text-secondary transition-colors"
            >
              {t('upgBackToFocus')}
            </button>
          </p>
        </footer>
      </div>
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
      <UpgradePage />
    </React.StrictMode>
  );
}
