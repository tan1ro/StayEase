import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export default function AuthGateModal({ open, title, message, cta, redirect, offerCode, onClose }) {
  if (!open) return null;

  const loginUrl = offerCode ? `${redirect}?offer=${offerCode}` : redirect;
  const registerUrl = offerCode ? `/register?offer=${offerCode}` : '/register';

  return (
    <div className="onboarding-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="onboarding-modal onboarding-modal--auth-gate" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="onboarding-modal__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <h2 className="onboarding-modal__headline">{title}</h2>
        <p className="onboarding-modal__body">{message}</p>
        <div className="onboarding-modal__actions onboarding-modal__actions--stack">
          <Link to={loginUrl} className="btn btn-primary onboarding-modal__cta" onClick={onClose}>
            {cta}
          </Link>
          <Link to={registerUrl} className="btn btn-outline onboarding-modal__secondary" onClick={onClose}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
