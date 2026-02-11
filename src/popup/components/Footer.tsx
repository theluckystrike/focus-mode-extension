import React from 'react';

interface FooterProps {
  version?: string;
}

const Footer: React.FC<FooterProps> = ({ version }) => {
  return (
    <footer className="zovo-footer">
      <a
        href="https://zovo.one"
        target="_blank"
        rel="noopener noreferrer"
        className="zovo-footer-link"
      >
        <span>Built by</span>
        <strong className="text-zovo-text-secondary">Zovo</strong>
        {version && (
          <>
            <span className="text-zovo-text-muted mx-1">|</span>
            <span className="text-zovo-text-muted">v{version}</span>
          </>
        )}
      </a>
    </footer>
  );
};

export default Footer;
