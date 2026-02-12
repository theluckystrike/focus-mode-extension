import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { t } from '../lib/i18n';
import '../popup/styles.css';

// ============================================================================
// SVG Icons
// ============================================================================

const Logo: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <rect width="56" height="56" rx="14" fill="#7C3AED" />
    <circle cx="28" cy="28" r="14" fill="none" stroke="white" strokeWidth="3.5" />
    <circle cx="28" cy="28" r="7" fill="none" stroke="white" strokeWidth="2.5" />
    <circle cx="28" cy="28" r="2.5" fill="white" />
  </svg>
);

const ShieldIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ChartIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const LockIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const KeyboardIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
    <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10" />
  </svg>
);

const CheckCircleIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// ============================================================================
// Feature Card Component
// ============================================================================

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => (
  <div
    className="bg-zovo-bg-secondary border border-zovo-border rounded-xl p-6 transition-all duration-200 hover:border-zovo-violet/40 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] zovo-slide-up"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zovo-violet/15 text-zovo-violet mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-zovo-text-primary mb-2">{title}</h3>
    <p className="text-sm text-zovo-text-secondary leading-relaxed">{description}</p>
  </div>
);

// ============================================================================
// Step Component
// ============================================================================

interface StepProps {
  number: number;
  title: string;
  description: string;
}

const Step: React.FC<StepProps> = ({ number, title, description }) => (
  <div className="flex items-start gap-4">
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zovo-violet text-white font-bold text-sm shrink-0">
      {number}
    </div>
    <div>
      <h4 className="font-semibold text-zovo-text-primary mb-1">{title}</h4>
      <p className="text-sm text-zovo-text-secondary">{description}</p>
    </div>
  </div>
);

// ============================================================================
// Welcome Page
// ============================================================================

const WelcomePage: React.FC = () => {
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // IntersectionObserver for "How it works" steps
    const stepsContainer = stepsRef.current;
    if (!stepsContainer) return;

    const stepElements = stepsContainer.querySelectorAll('.zovo-reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add staggered delay based on data attribute
            const el = entry.target as HTMLElement;
            const delay = el.dataset.revealDelay || '0';
            setTimeout(() => {
              el.classList.add('zovo-visible');
            }, parseInt(delay, 10));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    stepElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleGetStarted = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartUsing = () => {
    chrome.storage.local.set({ welcomeSeen: true }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to save welcome state:', chrome.runtime.lastError.message);
      }
      window.close();
    });
  };

  return (
    <div className="min-h-screen bg-zovo-black text-zovo-text-primary">
      {/* ================================================================
          HERO SECTION
          ================================================================ */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 zovo-hero-gradient" />
        <div className="absolute inset-0 zovo-hero-gradient-overlay" />

        <div className="relative max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
          <div className="flex justify-center mb-6 zovo-float">
            <Logo size={72} />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight zovo-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            {t('welReady')}
          </h1>
          <p className="text-lg text-zovo-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed zovo-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            {t('welSubtitle')}
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-8 py-3 bg-zovo-violet hover:bg-zovo-violet-hover text-white font-semibold rounded-xl transition-all duration-200 shadow-zovo-glow hover:shadow-[0_0_50px_rgba(124,58,237,0.35)] active:scale-[0.98] zovo-slide-up"
            style={{ animationDelay: '300ms', animationFillMode: 'both' }}
          >
            {t('btnGetStarted')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* ================================================================
          FEATURES SECTION
          ================================================================ */}
      <section id="features" className="max-w-4xl mx-auto px-8 pb-16">
        <h2 className="text-2xl font-bold text-center mb-2">{t('welFeaturesTitle')}</h2>
        <p className="text-zovo-text-secondary text-center mb-10">
          {t('welFeaturesSubtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeatureCard
            icon={<ShieldIcon />}
            title={t('welFeatureBlocking')}
            description={t('welFeatureBlockingDesc')}
            delay={0}
          />
          <FeatureCard
            icon={<ClockIcon />}
            title={t('welFeaturePomodoro')}
            description={t('welFeaturePomodoroDesc')}
            delay={120}
          />
          <FeatureCard
            icon={<ChartIcon />}
            title={t('welFeatureProgress')}
            description={t('welFeatureProgressDesc')}
            delay={240}
          />
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS SECTION
          ================================================================ */}
      <section className="max-w-4xl mx-auto px-8 pb-16" ref={stepsRef}>
        <h2 className="text-2xl font-bold text-center mb-2">{t('welHowTitle')}</h2>
        <p className="text-zovo-text-secondary text-center mb-10">
          {t('welHowSubtitle')}
        </p>

        <div className="bg-zovo-bg-secondary border border-zovo-border rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="zovo-reveal" data-reveal-delay="0">
              <Step
                number={1}
                title={t('welStep1Title')}
                description={t('welStep1Desc')}
              />
            </div>
            <div className="zovo-reveal" data-reveal-delay="150">
              <Step
                number={2}
                title={t('welStep2Title')}
                description={t('welStep2Desc')}
              />
            </div>
            <div className="zovo-reveal" data-reveal-delay="300">
              <Step
                number={3}
                title={t('welStep3Title')}
                description={t('welStep3Desc')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          KEYBOARD SHORTCUTS SECTION
          ================================================================ */}
      <section className="max-w-4xl mx-auto px-8 pb-16">
        <div className="bg-zovo-bg-secondary border border-zovo-border rounded-xl p-8 transition-all duration-200 hover:border-zovo-border-light">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zovo-violet/15 text-zovo-violet shrink-0">
              <KeyboardIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('welKeyboardShortcuts')}</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <kbd className="inline-flex items-center justify-center px-2.5 py-1 bg-zovo-bg-tertiary border border-zovo-border-light rounded-lg text-xs font-mono text-zovo-text-secondary transition-colors hover:border-zovo-violet/30">Alt</kbd>
                  <span className="text-zovo-text-muted text-xs">+</span>
                  <kbd className="inline-flex items-center justify-center px-2.5 py-1 bg-zovo-bg-tertiary border border-zovo-border-light rounded-lg text-xs font-mono text-zovo-text-secondary transition-colors hover:border-zovo-violet/30">Shift</kbd>
                  <span className="text-zovo-text-muted text-xs">+</span>
                  <kbd className="inline-flex items-center justify-center px-2.5 py-1 bg-zovo-bg-tertiary border border-zovo-border-light rounded-lg text-xs font-mono text-zovo-text-secondary transition-colors hover:border-zovo-violet/30">F</kbd>
                </div>
                <span className="text-sm text-zovo-text-secondary">{t('welShortcutDesc')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          PRIVACY SECTION
          ================================================================ */}
      <section className="max-w-4xl mx-auto px-8 pb-16">
        <div className="bg-zovo-bg-secondary border border-zovo-border rounded-xl p-8 transition-all duration-200 hover:border-zovo-border-light">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zovo-success/15 text-zovo-success shrink-0">
              <LockIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('welPrivacyTitle')}</h3>
              <p className="text-sm text-zovo-text-secondary leading-relaxed">
                {t('welPrivacyDesc')}
              </p>
              <div className="flex items-center gap-2 mt-3 text-zovo-success">
                <CheckCircleIcon />
                <span className="text-sm font-medium">{t('welPrivacyFirst')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FINAL CTA SECTION
          ================================================================ */}
      <section className="max-w-4xl mx-auto px-8 pb-16">
        <div className="relative overflow-hidden rounded-xl p-10 text-center zovo-cta-gradient">
          <h2 className="text-2xl font-bold mb-3">{t('welCtaTitle')}</h2>
          <p className="text-zovo-text-secondary mb-6">
            {t('welCtaDesc')}
          </p>
          <button
            onClick={handleStartUsing}
            className="inline-flex items-center gap-2 px-8 py-3 bg-zovo-violet hover:bg-zovo-violet-hover text-white font-semibold rounded-xl transition-all duration-200 shadow-zovo-glow hover:shadow-[0_0_50px_rgba(124,58,237,0.35)] active:scale-[0.98]"
          >
            {t('welStartUsing')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="max-w-4xl mx-auto px-8 pb-10">
        <div className="text-center text-sm text-zovo-text-muted">
          <p>
            {t('appNameFull')} v1.0.0
            {' '} | {' '}
            <a href="mailto:support@zovo.one" className="text-zovo-violet hover:underline transition-colors">
              {t('optSupport')}
            </a>
            {' '} | {' '}
            <a href="https://zovo.one/privacy" target="_blank" rel="noopener noreferrer" className="text-zovo-violet hover:underline transition-colors">
              {t('welPrivacyPolicy')}
            </a>
          </p>
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
      <WelcomePage />
    </React.StrictMode>
  );
}
