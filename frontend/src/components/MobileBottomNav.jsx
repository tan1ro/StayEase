import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Heart, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Icon, ICON } from './ui/Icon';

const HIDDEN_PREFIXES = ['/host', '/login', '/register', '/book/', '/receipt/', '/rooms/'];

export default function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav hide-desktop" aria-label="Mobile navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `mobile-bottom-nav__item${isActive ? ' mobile-bottom-nav__item--active' : ''}`}
      >
        <Icon icon={Compass} size={ICON.md} />
        <span>Explore</span>
      </NavLink>
      <NavLink
        to="/wishlist"
        className={({ isActive }) => `mobile-bottom-nav__item${isActive ? ' mobile-bottom-nav__item--active' : ''}`}
      >
        <Icon icon={Heart} size={ICON.md} />
        <span>Wishlists</span>
      </NavLink>
      <NavLink
        to={user ? '/profile' : '/login'}
        className={({ isActive }) => `mobile-bottom-nav__item${isActive ? ' mobile-bottom-nav__item--active' : ''}`}
      >
        <Icon icon={User} size={ICON.md} />
        <span>{user ? 'Profile' : 'Log in'}</span>
      </NavLink>
    </nav>
  );
}
