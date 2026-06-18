/** Primary host shell navigation (top bar). */
export const HOST_MAIN_NAV = [
  {
    to: '/host',
    label: 'Dashboard',
    match: (pathname) => pathname === '/host',
  },
  {
    to: '/host/calendar',
    label: 'Calendar',
    match: (pathname) => pathname.startsWith('/host/calendar'),
  },
  {
    to: '/host/rooms',
    label: 'Listings',
    match: (pathname) =>
      pathname.startsWith('/host/rooms')
      || pathname.startsWith('/host/listings'),
  },
  {
    to: '/host/bookings',
    label: 'Bookings',
    match: (pathname) => pathname.startsWith('/host/bookings'),
  },
  {
    to: '/host/messages',
    label: 'Messages',
    match: (pathname) => pathname.startsWith('/host/messages'),
  },
];
