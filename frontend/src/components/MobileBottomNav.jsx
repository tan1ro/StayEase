import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Compass, Heart, Search, User, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearchModal } from '../context/SearchModalContext';
import { Icon, ICON } from './ui/Icon';

const HIDDEN_PREFIXES = ['/host', '/login', '/register', '/book/', '/receipt/'];

export default function MobileBottomNav() {
  const { user, canAccessHostPortal } = useAuth();
  const location = useLocation();
  const { openSearch, open: searchOpen } = useSearchModal();

  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) {
    return null;
  }

  const isActive = (path, exact = false) => (
    exact ? location.pathname === path : location.pathname.startsWith(path)
  );

  return (
    <nav className="mobile-bottom-nav hide-desktop" aria-label="Mobile navigation">
      <Link
        to="/"
        className={`mobile-bottom-nav__item${isActive('/', true) ? ' mobile-bottom-nav__item--active' : ''}`}
      >
        <Icon icon={Compass} size={ICON.md} />
        <span>Home</span>
      </Link>
      <button
        type="button"
        className={`mobile-bottom-nav__item${searchOpen ? ' mobile-bottom-nav__item--active' : ''}`}
        onClick={openSearch}
        aria-label="Search"
        aria-pressed={searchOpen}
      >
        <Icon icon={Search} size={ICON.md} />
        <span>Search</span>
      </button>
      <Link
        to="/bookings"
        className={`mobile-bottom-nav__item${isActive('/bookings') ? ' mobile-bottom-nav__item--active' : ''}`}
      >
        <Icon icon={Calendar} size={ICON.md} />
        <span>Trips</span>
      </Link>
      <Link
        to="/wishlist"
        className={`mobile-bottom-nav__item${isActive('/wishlist') ? ' mobile-bottom-nav__item--active' : ''}`}
      >
        <Icon icon={Heart} size={ICON.md} />
        <span>Saved</span>
      </Link>
      {canAccessHostPortal && (
        <Link
          to="/host"
          className={`mobile-bottom-nav__item${isActive('/host') ? ' mobile-bottom-nav__item--active' : ''}`}
        >
          <Icon icon={Building2} size={ICON.md} />
          <span>Host</span>
        </Link>
      )}
      <Link
        to={user ? '/settings' : '/login'}
        className={`mobile-bottom-nav__item${isActive('/settings') || isActive('/login') ? ' mobile-bottom-nav__item--active' : ''}`}
      >
        <Icon icon={User} size={ICON.md} />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
