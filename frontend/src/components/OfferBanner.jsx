import { useEffect, useState } from 'react';
import { Tag, X } from 'lucide-react';
import { fetchOffers } from '../api/api';
import { Icon, ICON } from './ui/Icon';

const DISMISS_KEY = 'stayease_offer_banner_dismissed';

export default function OfferBanner() {
  const [offers, setOffers] = useState([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(DISMISS_KEY));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchOffers({ is_active: true })
      .then((data) => {
        const active = (Array.isArray(data) ? data : []).filter((o) => o.is_active);
        setOffers(active);
      })
      .catch(() => setOffers([]));
  }, []);

  useEffect(() => {
    if (offers.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % offers.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [offers.length]);

  if (!visible || !offers.length) return null;

  const offer = offers[index];
  const label = offer.discount_type === 'percentage'
    ? `${offer.discount_value || offer.value}% off`
    : `₹${offer.discount_value || offer.value} off`;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="offer-banner">
      <Icon icon={Tag} size={ICON.md} />
      <span>
        🎁 Use code <strong>{offer.code}</strong> for {label} your next booking!
      </span>
      <button type="button" className="btn btn-outline btn-sm" onClick={copyCode}>
        {copied ? '✓ Copied!' : 'Copy code'}
      </button>
      <button type="button" className="offer-banner__close" onClick={dismiss} aria-label="Dismiss">
        <Icon icon={X} size={ICON.sm} />
      </button>
    </div>
  );
}
