import { useState } from 'react';
import { authApi } from '../api/api';

const GOOGLE_DEMO_ACCOUNTS = [
  { email: 'rahul.oauth@stayease.com', name: 'Rahul OAuth' },
  { email: 'ananya.oauth@stayease.com', name: 'Ananya OAuth' },
];

export default function OAuthButtons({ disabled = false, asHost = false, referredBy = '', onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    if (disabled || loading) return;
    setLoading(true);
    onError?.('');

    const pick = GOOGLE_DEMO_ACCOUNTS[Math.floor(Math.random() * GOOGLE_DEMO_ACCOUNTS.length)];
    try {
      const { data } = await authApi.oauthGoogle({
        email: pick.email,
        name: pick.name,
        as_host: asHost,
        referred_by: referredBy || undefined,
      });
      onSuccess?.(data);
    } catch (err) {
      onError?.(err.normalized?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="oauth-buttons">
      <div className="oauth-buttons__divider" aria-hidden="true">
        <span>or</span>
      </div>
      <button
        type="button"
        className="oauth-buttons__btn"
        onClick={handleGoogle}
        disabled={disabled || loading}
      >
        <span className="oauth-buttons__icon" aria-hidden="true">G</span>
        {loading ? 'Connecting…' : 'Continue with Google'}
      </button>
      <p className="oauth-buttons__hint">
        Phone number is collected on the next step and is required to finish your account.
      </p>
    </div>
  );
}
