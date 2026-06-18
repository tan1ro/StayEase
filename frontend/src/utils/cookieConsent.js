export const COOKIE_CONSENT_KEY = 'stayease-cookie-consent';
export const COOKIE_CONSENT_VERSION = 1;

export function readCookieConsent() {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== COOKIE_CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCookieConsent(consent) {
  const payload = {
    essential: true,
    analytics: Boolean(consent.analytics),
    version: COOKIE_CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
  return payload;
}

export function clearCookieConsent() {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
}
