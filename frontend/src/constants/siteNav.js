import { APP_NAME } from '../theme';

/** Guest & traveller links shown in the site footer (Support column). */
export const SUPPORT_LINKS = [
  { to: '/', label: 'Stays' },
  { to: '/find-my-room', label: 'Find My Room' },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/bookings', label: 'My bookings' },
  { to: '/settings', label: 'Profile' },
  { to: '/help/cancellation', label: 'Cancellation options' },
];

/** Host links shown in the site footer (Hosting column). */
export const HOSTING_LINKS = [
  { to: '/host/rooms/add', label: 'List your room' },
  { to: '/host', label: 'Host dashboard' },
  { to: '/host/rooms', label: 'Manage rooms' },
  { to: '/host/bookings', label: 'Manage bookings' },
  { to: '/host/earnings', label: 'Earnings' },
  { to: '/host/payouts', label: 'Payouts' },
  { to: '/help/hosting-responsibly', label: 'Hosting responsibly' },
];

/** Company & policy links shown in the site footer. */
export const COMPANY_LINKS = [
  { to: '/privacy-policy', label: 'Privacy' },
  { to: '/cookie-policy', label: 'Cookies' },
  { to: '/terms', label: 'Terms' },
  { to: '/help/billing-gst', label: 'Billing & GST' },
  { to: '/help/invoices', label: 'Invoices & receipts' },
  { to: '/help/tourist-guidelines', label: 'Tourist guidelines' },
  { to: '/help/host-guidelines', label: 'Host guidelines' },
];

export const FOOTER_COLUMNS = [
  { title: 'Support', links: SUPPORT_LINKS },
  { title: 'Hosting', links: HOSTING_LINKS },
  { title: APP_NAME, links: COMPANY_LINKS },
];
