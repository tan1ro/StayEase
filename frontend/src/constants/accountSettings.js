import {
  BarChart3,
  Bell,
  Briefcase,
  CreditCard,
  FileText,
  Globe,
  Heart,
  Lock,
  Luggage,
  Monitor,
  Shield,
  Ticket,
  User,
} from 'lucide-react';

export const GUEST_SETTINGS_SECTIONS = [
  { id: 'trips', label: 'Past trips', icon: Luggage },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'personal', label: 'Personal information', icon: User },
  { id: 'security', label: 'Login & security', icon: Shield },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'taxes', label: 'Taxes', icon: FileText },
  { id: 'payments', label: 'Payments', icon: CreditCard, badge: 'New' },
  { id: 'locale', label: 'Languages & currency', icon: Globe },
  { id: 'booking-permissions', label: 'Booking permissions', icon: Ticket },
  { id: 'travel-work', label: 'Travel for work', icon: Briefcase },
  { id: 'pro-tools', label: 'Professional hosting tools', icon: Monitor, footer: true },
];

export const HOST_SETTINGS_SECTIONS = [
  { id: 'personal', label: 'Personal information', icon: User },
  { id: 'security', label: 'Login & security', icon: Shield },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'taxes', label: 'Taxes', icon: FileText },
  { id: 'payments', label: 'Payments', icon: CreditCard, badge: 'New' },
  { id: 'locale', label: 'Languages & currency', icon: Globe },
  { id: 'hosting-prefs', label: 'Hosting preferences', icon: Ticket },
  { id: 'pro-tools', label: 'Professional hosting tools', icon: Monitor, footer: true },
];

export const TRAVEL_PREFS_KEY = 'stayease_travel_prefs';
export const PRIVACY_PREFS_KEY = 'stayease_privacy_prefs';
export const LOCALE_PREFS_KEY = 'stayease_locale_prefs';
export const NOTIFICATION_DETAIL_KEY = 'stayease_notification_detail_prefs';
export const ADDRESS_PREFS_KEY = 'stayease_address_prefs';
export const PREFERRED_NAME_KEY = 'stayease_preferred_name';
export const PRO_TOOLS_PREFS_KEY = 'stayease_pro_tools_prefs';

export const DEFAULT_TRAVEL_PREFS = {
  food: '',
  smoking: '',
  alcohol: '',
  roomCategory: '',
};

export const DEFAULT_PRIVACY_PREFS = {
  showReadReceipts: true,
  listingsInSearch: false,
  shareReviewCity: false,
  shareReviewTripType: false,
  shareReviewLength: false,
  shareReviewBookedServices: false,
  analyticsOptIn: true,
};

export const DEFAULT_LOCALE_PREFS = {
  language: 'English',
  currency: 'Indian rupee',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
};

export const DEFAULT_NOTIFICATION_DETAIL = {
  hostingInsights: false,
  hostingUpdates: true,
  travelOffers: true,
  tripPlanning: true,
  stayeaseUpdates: true,
  feedback: true,
  travelRegulations: true,
  tripReminders: true,
  accountAlerts: true,
  marketingOptOut: false,
};

export const DEFAULT_ADDRESS_PREFS = {
  residentialAddress: '',
  postalAddress: '',
  emergencyContact: '',
};

export const DEFAULT_PRO_TOOLS_PREFS = {
  enabled: false,
  profileSlug: '',
};

export function loadJsonPref(key, defaults) {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(key) || '{}') };
  } catch {
    return { ...defaults };
  }
}

export function saveJsonPref(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function maskEmail(email) {
  if (!email) return 'Not provided';
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const visible = user.slice(0, 1);
  const masked = user.length > 2 ? `${visible}***${user.slice(-1)}` : `${visible}***`;
  return `${masked}@${domain}`;
}

export function firstName(name) {
  if (!name) return '';
  return name.trim().split(/\s+/)[0];
}

export function formatTimezoneLabel(timezone) {
  if (!timezone) return 'Not set';
  try {
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    const abbr = parts.find((p) => p.type === 'timeZoneName')?.value;
    const label = timezone.replace(/_/g, ' ');
    return abbr ? `${label} (${abbr})` : label;
  } catch {
    return timezone.replace(/_/g, ' ');
  }
}
