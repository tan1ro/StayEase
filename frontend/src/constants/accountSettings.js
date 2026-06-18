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
  { id: 'dashboard', label: 'My Spending', icon: BarChart3 },
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
export const HOST_TAX_PREFS_KEY = 'stayease_host_tax_prefs';
export const HOST_PAYOUT_PREFS_KEY = 'stayease_host_payout_prefs';
export const HOST_BOOKING_NOTIF_KEY = 'stayease_host_booking_notifs';
export const GUEST_TAX_PREFS_KEY = 'stayease_guest_tax_prefs';
export const HOST_HOSTING_PREFS_KEY = 'stayease_host_hosting_prefs';

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

export const DEFAULT_HOST_TAX_PREFS = {
  gstin: '',
  pan: '',
  businessName: '',
};

export const DEFAULT_HOST_PAYOUT_PREFS = {
  method: '',
  upiId: '',
  accountHolder: '',
  accountNumber: '',
  ifsc: '',
};

export const DEFAULT_HOST_BOOKING_NOTIFS = {
  newBooking: true,
  cancellation: true,
  guestMessage: true,
  payout: true,
  review: true,
};

export const DEFAULT_GUEST_TAX_PREFS = {
  gstin: '',
};

export const DEFAULT_HOST_HOSTING_PREFS = {
  instantBook: true,
  guestPhotoRequired: false,
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

export function identityStatusLabel(user) {
  const proof = user?.identity_proof;
  if (proof?.verified) return 'Verified';
  if (proof?.document_url) return 'Under review';
  return 'Not started';
}

export function identityActionLabel(user) {
  const proof = user?.identity_proof;
  if (proof?.verified || proof?.document_url) return 'View';
  return 'Start';
}

export function maskGstin(gstin) {
  if (!gstin) return null;
  if (gstin.length <= 4) return gstin;
  return `${gstin.slice(0, 2)}${'*'.repeat(Math.max(0, gstin.length - 4))}${gstin.slice(-2)}`;
}

export function maskPan(pan) {
  if (!pan) return null;
  if (pan.length <= 2) return pan;
  return `${pan.slice(0, 1)}${'*'.repeat(Math.max(0, pan.length - 2))}${pan.slice(-1)}`;
}

export function payoutMethodLabel(prefs) {
  if (!prefs) return null;
  if (prefs.method === 'upi' && prefs.upiId) return `UPI · ${prefs.upiId}`;
  if (prefs.method === 'bank' && prefs.accountNumber) {
    const last4 = prefs.accountNumber.slice(-4);
    return `Bank account · ••••${last4}`;
  }
  return null;
}

export function hostRequirementItems(user, taxPrefs, payoutPrefs, addressPrefs) {
  return [
    { id: 'phone', label: 'Phone number', done: Boolean(user?.phone) },
    { id: 'identity', label: 'Government ID', done: Boolean(user?.identity_proof?.verified || user?.identity_proof?.document_url) },
    { id: 'avatar', label: 'Profile photo', done: Boolean(user?.avatar_url) },
    { id: 'gstin', label: 'GSTIN', done: Boolean(taxPrefs?.gstin) },
    { id: 'payout', label: 'Payout method', done: Boolean(payoutMethodLabel(payoutPrefs)) },
    { id: 'address', label: 'Business address', done: Boolean(addressPrefs?.residentialAddress) },
  ];
}
