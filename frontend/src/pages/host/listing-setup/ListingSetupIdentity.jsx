import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HostSetupShell from '../../../components/host/HostSetupShell';
import { useListingSetupRoom } from '../../../hooks/useListingSetupRoom';

const METHODS = [
  {
    id: 'aadhaar',
    label: 'Confirm your Aadhaar details',
    description: "You'll confirm your legal information via DigiLocker or Aadhaar upload.",
  },
  {
    id: 'document',
    label: 'Use your ID',
    description: "You'll use an official document like a PAN card, passport, or driving licence.",
  },
];

export default function ListingSetupIdentity() {
  const navigate = useNavigate();
  const { room, loading, setupQuery } = useListingSetupRoom();
  const [method, setMethod] = useState('document');

  return (
    <HostSetupShell
      room={room}
      roomLoading={loading}
      onBack={() => navigate(`/host/listings/setup${setupQuery}`)}
      onNext={() => navigate(`/host/listings/setup/identity/upload${setupQuery}&method=${method}`)}
      nextDisabled={!method}
    >
      <div className="host-setup-page host-setup-page--narrow">
        <h1 className="host-setup-page__title">How do you want to verify your identity?</h1>
        <div className="host-setup-option-list" role="radiogroup" aria-label="Identity verification method">
          {METHODS.map((item) => {
            const active = method === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`host-setup-option ${active ? 'host-setup-option--active' : ''}`}
                onClick={() => setMethod(item.id)}
              >
                <strong>{item.label}</strong>
                <p>{item.description}</p>
              </button>
            );
          })}
        </div>
        <p className="host-setup-page__fineprint">
          Your info is handled according to our{' '}
          <Link to="/privacy-policy">Privacy Policy</Link>.
          {' '}Learn more about{' '}
          <Link to="/privacy-policy">identity verification on StayEase</Link>.
        </p>
      </div>
    </HostSetupShell>
  );
}
