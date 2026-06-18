import { Link } from 'react-router-dom';
import { ExternalLink, Github, Globe, Instagram, Linkedin, Twitter } from 'lucide-react';
import Logo from './Logo';
import { APP_NAME } from '../theme';
import { FOOTER_COLUMNS } from '../constants/siteNav';
import { Icon, ICON } from './ui/Icon';

const DEVELOPER = {
  handle: '@tan1ro',
  github: 'https://github.com/tan1ro',
  portfolio: 'https://nandeesh-kantli.vercel.app/',
};

function FooterColumn({ title, links }) {
  return (
    <div className="footer__column">
      <h4 className="footer__column-title">{title}</h4>
      <nav className="footer__links footer__links--column" aria-label={title}>
        {links.map(({ to, label }) => (
          <Link key={`${title}-${to}`} to={to}>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Logo variant="full" />
          <p className="footer__tagline">Find your perfect stay, anywhere in India.</p>
        </div>
        {FOOTER_COLUMNS.map(({ title, links }) => (
          <FooterColumn key={title} title={title} links={links} />
        ))}
      </div>
      <div className="footer__credit">
        <p className="footer__credit-text">
          Developed and maintained by{' '}
          <a
            href={DEVELOPER.github}
            target="_blank"
            rel="noopener noreferrer"
            className="footer__credit-handle"
          >
            {DEVELOPER.handle}
          </a>
        </p>
        <div className="footer__credit-actions">
          <a
            href={DEVELOPER.github}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
          >
            <Icon icon={Github} size={ICON.sm} />
            GitHub
          </a>
          <a
            href={DEVELOPER.portfolio}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            <Icon icon={ExternalLink} size={ICON.sm} />
            Portfolio
          </a>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="footer__bottom-left">
          <span>© 2026 {APP_NAME}</span>
          <span className="footer__legal-links">
            <Link to="/privacy-policy">Privacy</Link>
            <span aria-hidden="true">·</span>
            <Link to="/cookie-policy">Cookies</Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms">Terms</Link>
            <span aria-hidden="true">·</span>
            <Link to="/help">Help</Link>
            <span aria-hidden="true">·</span>
            <Link to="/help/billing-gst">Billing</Link>
          </span>
        </div>
        <div className="footer__bottom-right">
          <span className="footer__locale">
            <Icon icon={Globe} size={ICON.sm} />
            English (IN)
          </span>
          <span className="footer__locale">₹ INR</span>
          <div className="footer__social">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Icon icon={Twitter} size={ICON.md} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Icon icon={Instagram} size={ICON.md} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Icon icon={Linkedin} size={ICON.md} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
