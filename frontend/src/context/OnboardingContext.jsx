import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const OnboardingContext = createContext(null);

const WELCOME_OFFER_KEY = 'stayease_welcome_offer_dismissed';

export function OnboardingProvider({ children }) {
  const [authGate, setAuthGate] = useState(null);

  const openAuthGate = useCallback((options = {}) => {
    setAuthGate({
      title: options.title || 'Log in to continue',
      message: options.message || 'Create an account or log in to save stays to your wishlist.',
      cta: options.cta || 'Log in',
      redirect: options.redirect || '/login',
      offerCode: options.offerCode || null,
    });
  }, []);

  const closeAuthGate = useCallback(() => setAuthGate(null), []);

  const isWelcomeOfferDismissed = () => localStorage.getItem(WELCOME_OFFER_KEY) === '1';

  const dismissWelcomeOffer = useCallback(() => {
    localStorage.setItem(WELCOME_OFFER_KEY, '1');
  }, []);

  const value = useMemo(
    () => ({
      authGate,
      openAuthGate,
      closeAuthGate,
      isWelcomeOfferDismissed,
      dismissWelcomeOffer,
    }),
    [authGate, openAuthGate, closeAuthGate, dismissWelcomeOffer],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
