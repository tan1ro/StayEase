import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Icon, ICON } from './ui/Icon';

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  hideHeader = false,
}) {
  useEffect(() => {
    if (!open) return;
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

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`modal modal--${size}${hideHeader ? ' modal--bare' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader && (
          <div className="modal__header">
            {title && <h2 className="modal__title">{title}</h2>}
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
              <Icon icon={X} size={ICON.lg} />
            </button>
          </div>
        )}
        {hideHeader && (
          <button
            type="button"
            className="modal__close modal__close--floating"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon icon={X} size={ICON.lg} />
          </button>
        )}
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
