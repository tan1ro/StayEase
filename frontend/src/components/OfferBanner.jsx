import { useEffect, useMemo, useState } from 'react';
import { Copy, Tag, X } from 'lucide-react';
import { fetchOffers } from '../api/api';
import { Icon, ICON } from './ui/Icon';

const DISMISS_KEY = 'stayease_offer_banner_dismissed';
const ROTATE_MS = 4000;

function offerLabel(offer) {
  if (!offer) return '';
  if (offer.type === 'percentage' || offer.discount_type === 'percentage') {
    return `${offer.value ?? offer.discount_value}% off`;
  }
  return `₹${offer.value ?? offer.discount_value} off`;
}

export default function OfferBanner() {
  const [offers, setOffers] = useState([]);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchOffers({ is_active: true })
      .then((data) => {
        if (!cancelled) setOffers(Array.isArray(data) ? data.filter((o) => o.is_active !== false) : []);
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const activeOffers = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return offers.filter((o) => !o.valid_until || o.valid_until >= today);
  }, [offers]);

  useEffect(() => {
    if (activeOffers.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % activeOffers.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [activeOffers.length]);

  if (dismissed || loading || activeOffers.length === 0) return null;

  const offer = activeOffers[index % activeOffers.length];
  const code = offer.code;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="offer-banner" role="status">
      <Icon icon={Tag} size={ICON.md} />
      <span>
        🎁 Use code <strong>{code}</strong> for {offerLabel(offer)} your next booking!
      </span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={copyCode}>
        <Copy size={14} /> {copied ? '✓ Copied!' : 'Copy code'}
      </button>
      <button type="button" className="offer-banner__close" onClick={dismiss} aria-label="Dismiss">
        <Icon icon={X} size={ICON.sm} />
      </button>
    </div>
  );
}
