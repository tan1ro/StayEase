import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function ListingPolicyModal({ open, onClose, title, subtitle, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="listing-policy-modal" onClick={onClose} role="dialog" aria-modal="true">
      <div className="listing-policy-modal__panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="listing-policy-modal__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <h2 className="listing-policy-modal__title">{title}</h2>
        {subtitle && <p className="listing-policy-modal__subtitle">{subtitle}</p>}
        <div className="listing-policy-modal__body">{children}</div>
        {footer && <div className="listing-policy-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
