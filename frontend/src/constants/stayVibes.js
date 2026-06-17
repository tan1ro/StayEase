import {
  Briefcase,
  Building2,
  Heart,
  Mountain,
  Sparkles,
  Waves,
} from 'lucide-react';

/** StayEase-only highlight chips — India hotel stays, not generic Airbnb tags */
export const STAY_VIBES = [
  {
    id: 'hill',
    label: 'Hill retreat',
    icon: Mountain,
    snippet: 'Cool mountain air, scenic valley views, and a peaceful escape from city life.',
  },
  {
    id: 'beach',
    label: 'Beach escape',
    icon: Waves,
    snippet: 'Walk to the coast, enjoy sea breeze, and unwind by the shoreline.',
  },
  {
    id: 'heritage',
    label: 'Heritage stay',
    icon: Building2,
    snippet: 'Stay amid local culture, architecture, and timeless neighbourhood charm.',
  },
  {
    id: 'business',
    label: 'Business ready',
    icon: Briefcase,
    snippet: 'Reliable Wi‑Fi, easy check-in, and a comfortable base for work trips.',
  },
  {
    id: 'family',
    label: 'Family favourite',
    icon: Heart,
    snippet: 'Spacious, safe, and welcoming — perfect for families exploring together.',
  },
  {
    id: 'boutique',
    label: 'Boutique charm',
    icon: Sparkles,
    snippet: 'Thoughtful hospitality, curated comfort, and a memorable boutique feel.',
  },
];

export function buildDescriptionFromVibes(vibeIds, form) {
  const selected = STAY_VIBES.filter((v) => vibeIds.includes(v.id));
  const area = [form.location?.area, form.location?.city].filter(Boolean).join(', ');
  const opener = area
    ? `Stay in ${area} at our ${form.room_category?.toLowerCase() || 'room'} — hosted on StayEase with GST-ready billing.`
    : `A welcoming ${form.room_category?.toLowerCase() || 'room'} on StayEase with transparent pricing and GST invoices.`;

  const highlights = selected.map((v) => v.snippet).join(' ');
  const closing = 'Enjoy clean linens, responsive host support, and a smooth booking experience from check-in to checkout.';

  return `${opener} ${highlights} ${closing}`.trim();
}

export const STAYEASE_OFFERS = [
  {
    id: 'launch',
    label: 'New listing boost',
    description: 'Offer 15% off your first 3 bookings to earn early reviews faster.',
    percent: 15,
  },
  {
    id: 'weekly',
    label: 'Weekly stay discount',
    description: 'Reward guests staying 7 nights or more with a better nightly rate.',
    percent: 10,
  },
  {
    id: 'monthly',
    label: 'Monthly stay discount',
    description: 'Attract long-stay guests with a special rate for 28+ nights.',
    percent: 20,
  },
];
