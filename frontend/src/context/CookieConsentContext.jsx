import { createContext, useContext, useMemo, useState } from 'react';
import CookieConsentBanner from '../components/CookieConsentBanner';
import { readCookieConsent, saveCookieConsent } from '../utils/cookieConsent';

const CookieConsentContext = createContext(null);

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => readCookieConsent());
  const hasConsented = Boolean(consent?.essential);

  const acceptAll = () => {
    const next = saveCookieConsent({ analytics: true });
    setConsent(next);
  };

  const acceptEssential = () => {
    const next = saveCookieConsent({ analytics: false });
    setConsent(next);
  };

  const value = useMemo(
    () => ({ consent, hasConsented, acceptAll, acceptEssential }),
    [consent, hasConsented],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {!hasConsented && <CookieConsentBanner />}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}
