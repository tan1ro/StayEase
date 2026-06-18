import { Link, useLocation } from 'react-router-dom';
import {
  Building2,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
} from 'lucide-react';
import { Icon, ICON } from '../ui/Icon';

const NAV_ITEMS = [
  {
    to: '/host',
    label: 'Today',
    icon: LayoutDashboard,
    match: (pathname) => pathname === '/host',
  },
  {
    to: '/host/calendar',
    label: 'Calendar',
    icon: Calendar,
    match: (pathname) => pathname.startsWith('/host/calendar'),
  },
  {
    to: '/host/rooms',
    label: 'Listings',
    icon: Building2,
    match: (pathname) =>
      pathname.startsWith('/host/rooms') || pathname.startsWith('/host/listings'),
  },
  {
    to: '/host/bookings',
    label: 'Bookings',
    icon: ClipboardList,
    match: (pathname) => pathname.startsWith('/host/bookings'),
  },
  {
    to: '/host/messages',
    label: 'Inbox',
    icon: MessageCircle,
    match: (pathname) => pathname.startsWith('/host/messages'),
  },
];

export default function HostMobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="host-mobile-bottom-nav hide-desktop" aria-label="Host navigation">
      {NAV_ITEMS.map(({ to, label, icon, match }) => (
        <Link
          key={to}
          to={to}
          className={`host-mobile-bottom-nav__item${
            match(pathname) ? ' host-mobile-bottom-nav__item--active' : ''
          }`}
        >
          <Icon icon={icon} size={ICON.md} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
