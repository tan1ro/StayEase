import { Bell, X } from 'lucide-react';
import { useState } from 'react';
import { Icon, ICON } from './ui/Icon';

export default function NotificationBanner({ title, body, onDismiss, onAction, actionLabel }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="notification-banner">
      <Icon icon={Bell} size={ICON.lg} />
      <div className="notification-banner__content">
        {title && <strong>{title}</strong>}
        {body && <p>{body}</p>}
      </div>
      {actionLabel && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      <button
        type="button"
        className="notification-banner__close"
        onClick={() => { setVisible(false); onDismiss?.(); }}
        aria-label="Dismiss"
      >
        <Icon icon={X} size={ICON.sm} />
      </button>
    </div>
  );
}
