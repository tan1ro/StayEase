import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const OFFER_IMAGE =
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=480&fit=crop';

export default function WelcomeOfferModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="onboarding-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="onboarding-modal onboarding-modal--offer" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="onboarding-modal__close onboarding-modal__close--overlay" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <div className="onboarding-modal__hero">
          <img src={OFFER_IMAGE} alt="Resort pool villa" />
        </div>
        <div className="onboarding-modal__content">
          <h2 className="onboarding-modal__headline">Save 10% on your next stay</h2>
          <p className="onboarding-modal__body">
            Sign up and use code <strong>WELCOME10</strong> on your first booking. Save up to ₹500.
            Terms apply.
          </p>
          <Link
            to="/login?offer=WELCOME10"
            className="btn btn-primary onboarding-modal__cta"
            onClick={onClose}
          >
            Log in to claim offer
          </Link>
        </div>
      </div>
    </div>
  );
}
