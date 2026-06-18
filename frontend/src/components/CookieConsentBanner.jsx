import { Link } from 'react-router-dom';
import { useCookieConsent } from '../context/CookieConsentContext';

export default function CookieConsentBanner() {
  const { acceptAll, acceptEssential } = useCookieConsent();

  return (
    <div className="cookie-consent no-print" role="dialog" aria-labelledby="cookie-consent-title">
      <div className="cookie-consent__inner">
        <div className="cookie-consent__copy">
          <h2 id="cookie-consent-title">Cookies &amp; privacy</h2>
          <p>
            StayEase uses essential cookies and local storage for sign-in, bookings, and your theme
            preference. With your consent we may also use analytics cookies to improve the site.
            Read our{' '}
            <Link to="/cookie-policy">Cookie Policy</Link> and{' '}
            <Link to="/privacy-policy">Privacy Policy</Link>.
          </p>
        </div>
        <div className="cookie-consent__actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={acceptEssential}>
            Essential only
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={acceptAll}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
