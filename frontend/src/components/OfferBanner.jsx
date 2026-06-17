import { Tag, X } from 'lucide-react';
import { useState } from 'react';
import { Icon, ICON } from './ui/Icon';

export default function OfferBanner({ code, description, onDismiss }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div className="offer-banner">
      <Icon icon={Tag} size={ICON.md} />
      <span>
        Use code <strong>{code}</strong>
        {description && ` — ${description}`}
      </span>
      <button type="button" className="offer-banner__close" onClick={dismiss} aria-label="Dismiss">
        <Icon icon={X} size={ICON.sm} />
      </button>
    </div>
  );
}
