import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorMessage from '../../../components/ErrorMessage';
import HostSetupShell from '../../../components/host/HostSetupShell';
import { authApi } from '../../../api/api';
import { useAuth } from '../../../context/AuthContext';
import {
  markPhoneSetupComplete,
  useListingSetupRoom,
} from '../../../hooks/useListingSetupRoom';
import { validateIndianPhone } from '../../../utils/identityValidation';

export default function ListingSetupPhone() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { room, loading, setupQuery } = useListingSetupRoom();
  const [phone, setPhone] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const phoneCheck = validateIndianPhone(phone, { required: true });

  const handleContinue = async () => {
    if (!phoneCheck.valid) {
      setError(phoneCheck.message);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('phone', phoneCheck.value);
      fd.append('notification_prefs', JSON.stringify({
        email: user?.notification_prefs?.email !== false,
        whatsapp: true,
      }));
      await authApi.updateProfile(fd);
      await refreshUser();
      markPhoneSetupComplete(user?.id);
      navigate(`/host/listings/setup${setupQuery}`);
    } catch (err) {
      setError(err.normalized?.message || 'Could not save phone number.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HostSetupShell
      room={room}
      roomLoading={loading}
      onBack={() => navigate(`/host/listings/setup${setupQuery}`)}
      onNext={handleContinue}
      nextLabel={submitting ? 'Saving…' : 'Continue'}
      nextDisabled={!phoneCheck.valid || submitting}
    >
      <div className="host-setup-page host-setup-page--narrow">
        <h1 className="host-setup-page__title">Which number can guests use to contact you?</h1>
        <p className="host-setup-page__subtitle">
          We&apos;ll send you booking requests, reminders, and WhatsApp alerts. This number should be able to receive texts or calls.
        </p>

        <ErrorMessage message={error} />

        <div className="host-setup-phone-field">
          <label className="host-setup-phone-field__region" htmlFor="host-phone">
            <span className="host-setup-phone-field__label">Country / Region</span>
            <span>India (+91)</span>
          </label>
          <input
            id="host-phone"
            className="host-setup-phone-field__input"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <p className="host-setup-page__fineprint">
          We&apos;ll call or text you to confirm your number. Standard message and data rates apply.
        </p>
      </div>
    </HostSetupShell>
  );
}
