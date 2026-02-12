import React from 'react';
import { createRoot } from 'react-dom/client';
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
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-zovo-bg-secondary border border-zovo-border rounded-xl p-6 hover:border-zovo-violet/40 transition-colors">
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
  const handleGetStarted = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartUsing = () => {
    chrome.storage.local.set({ welcomeSeen: true }, () => {
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
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124, 58, 237, 0.25) 0%, rgba(124, 58, 237, 0.08) 40%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.06) 0%, transparent 60%)',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
          <div className="flex justify-center mb-6">
            <Logo size={72} />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            Focus Mode Pro is ready to go
          </h1>
          <p className="text-lg text-zovo-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
            Block distracting websites and stay productive with built-in Pomodoro timers, stats tracking, and more.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-8 py-3 bg-zovo-violet hover:bg-zovo-violet-hover text-white font-semibold rounded-xl transition-colors shadow-zovo-glow"
          >
            Get Started
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
        <h2 className="text-2xl font-bold text-center mb-2">Everything you need to stay focused</h2>
        <p className="text-zovo-text-secondary text-center mb-10">
          Powerful tools designed to eliminate distractions and build better habits.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeatureCard
            icon={<ShieldIcon />}
            title="Smart Blocking"
            description="Block any website with patterns, categories, or regex. Whitelist work sites to keep them accessible."
          />
          <FeatureCard
            icon={<ClockIcon />}
            title="Pomodoro Timer"
            description="Work in focused 25-minute intervals with automatic breaks. Customize timings to match your rhythm."
          />
          <FeatureCard
            icon={<ChartIcon />}
            title="Track Progress"
            description="Monitor focus time, sessions completed, sites blocked, and build productive streaks."
          />
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS SECTION
          ================================================================ */}
      <section className="max-w-4xl mx-auto px-8 pb-16">
        <h2 className="text-2xl font-bold text-center mb-2">How it works</h2>
        <p className="text-zovo-text-secondary text-center mb-10">
          Get up and running in seconds. No complicated setup required.
        </p>

        <div className="bg-zovo-bg-secondary border border-zovo-border rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step
              number={1}
              title="Click the icon"
              description="Click the Focus Mode Pro icon in your toolbar to open the popup."
            />
            <Step
              number={2}
              title="Choose your mode"
              description="Select Pomodoro, Custom timer, or Indefinite focus mode."
            />
            <Step
              number={3}
              title="Start focusing"
              description="Hit Start Focus and distracting sites will be blocked automatically."
            />
          </div>
        </div>
      </section>

      {/* ================================================================
          KEYBOARD SHORTCUTS SECTION
          ================================================================ */}
      <section className="max-w-4xl mx-auto px-8 pb-16">
        <div className="bg-zovo-bg-secondary border border-zovo-border rounded-xl p-8">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zovo-violet/15 text-zovo-violet shrink-0">
              <KeyboardIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Keyboard Shortcuts</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <kbd className="inline-flex items-center justify-center px-2.5 py-1 bg-zovo-bg-tertiary border border-zovo-border-light rounded-lg text-xs font-mono text-zovo-text-secondary">Alt</kbd>
                  <span className="text-zovo-text-muted text-xs">+</span>
                  <kbd className="inline-flex items-center justify-center px-2.5 py-1 bg-zovo-bg-tertiary border border-zovo-border-light rounded-lg text-xs font-mono text-zovo-text-secondary">Shift</kbd>
                  <span className="text-zovo-text-muted text-xs">+</span>
                  <kbd className="inline-flex items-center justify-center px-2.5 py-1 bg-zovo-bg-tertiary border border-zovo-border-light rounded-lg text-xs font-mono text-zovo-text-secondary">F</kbd>
                </div>
                <span className="text-sm text-zovo-text-secondary">Toggle focus mode on or off from any tab</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          PRIVACY SECTION
          ================================================================ */}
      <section className="max-w-4xl mx-auto px-8 pb-16">
        <div className="bg-zovo-bg-secondary border border-zovo-border rounded-xl p-8">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zovo-success/15 text-zovo-success shrink-0">
              <LockIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Your privacy matters</h3>
              <p className="text-sm text-zovo-text-secondary leading-relaxed">
                Focus Mode Pro works primarily on your device. No browsing data is collected or sent to external servers.
                Optional license verification connects to the Zovo API only when activating a Pro license.
              </p>
              <div className="flex items-center gap-2 mt-3 text-zovo-success">
                <CheckCircleIcon />
                <span className="text-sm font-medium">Privacy-first by design</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FINAL CTA SECTION
          ================================================================ */}
      <section className="max-w-4xl mx-auto px-8 pb-16">
        <div
          className="relative overflow-hidden rounded-xl p-10 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(124, 58, 237, 0.05) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
          }}
        >
          <h2 className="text-2xl font-bold mb-3">Ready to focus?</h2>
          <p className="text-zovo-text-secondary mb-6">
            Your productivity journey starts now. Block distractions and build better habits.
          </p>
          <button
            onClick={handleStartUsing}
            className="inline-flex items-center gap-2 px-8 py-3 bg-zovo-violet hover:bg-zovo-violet-hover text-white font-semibold rounded-xl transition-colors shadow-zovo-glow"
          >
            Start Using Focus Mode Pro
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
            Focus Mode Pro v1.0.0
            {' '} | {' '}
            <a href="mailto:support@zovo.one" className="text-zovo-violet hover:underline">
              Support
            </a>
            {' '} | {' '}
            <a href="https://zovo.one/privacy" target="_blank" rel="noopener noreferrer" className="text-zovo-violet hover:underline">
              Privacy Policy
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
