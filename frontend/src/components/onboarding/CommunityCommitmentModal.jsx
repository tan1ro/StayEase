import { useEffect } from 'react';
import { X } from 'lucide-react';
import Logo from '../Logo';

export default function CommunityCommitmentModal({ open, onAgree, onDecline }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="community-title">
      <div className="onboarding-modal onboarding-modal--community">
        <button type="button" className="onboarding-modal__close" onClick={onDecline} aria-label="Close">
          <X size={18} />
        </button>
        <div className="onboarding-modal__brand">
          <Logo to={null} variant="full" />
        </div>
        <p className="onboarding-modal__eyebrow">Our community commitment</p>
        <h2 id="community-title" className="onboarding-modal__headline">
          StayEase is a community where anyone can belong
        </h2>
        <p className="onboarding-modal__body">
          To ensure this, we&apos;re asking you to commit to the following: I agree to treat everyone
          in the StayEase community — regardless of their race, religion, national origin, ethnicity,
          disability, sex, gender identity, sexual orientation, or age — with respect, and without
          judgement or bias.
        </p>
        <button type="button" className="onboarding-modal__link-btn" onClick={onDecline}>
          Learn more
        </button>
        <div className="onboarding-modal__actions onboarding-modal__actions--stack">
          <button type="button" className="btn btn-primary onboarding-modal__cta" onClick={onAgree}>
            Agree and continue
          </button>
          <button type="button" className="btn btn-ghost onboarding-modal__secondary" onClick={onDecline}>
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
