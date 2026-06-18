import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Compass, Heart, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearchModal } from '../context/SearchModalContext';
import { Icon, ICON } from './ui/Icon';
import { isHostPortalPath } from '../utils/routes';

const HIDDEN_PREFIXES = ['/login', '/register', '/book/', '/receipt/'];

function shouldHideMobileNav(pathname) {
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return isHostPortalPath(pathname);
}

export default function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { open, openSearch } = useSearchModal();

  if (shouldHideMobileNav(location.pathname)) {
    return null;
  }

  const handleSearch = () => {
    if (location.pathname !== '/') {
      navigate('/');
    }
    openSearch();
  };

  return (
    <nav className="mobile-bottom-nav hide-desktop" aria-label="Mobile navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `mobile-bottom-nav__item${isActive && !open ? ' mobile-bottom-nav__item--active' : ''}`}
      >
        <Icon icon={Compass} size={ICON.md} />
        <span>Home</span>
      </NavLink>
      <button
        type="button"
        className={`mobile-bottom-nav__item${open ? ' mobile-bottom-nav__item--active' : ''}`}
        onClick={handleSearch}
        aria-label="Search stays"
        aria-expanded={open}
      >
        <Icon icon={Search} size={ICON.md} />
        <span>Search</span>
      </button>
      <NavLink
        to="/bookings"
        className={({ isActive }) => `mobile-bottom-nav__item${isActive ? ' mobile-bottom-nav__item--active' : ''}`}
      >
        <Icon icon={Calendar} size={ICON.md} />
        <span>Trips</span>
      </NavLink>
      <NavLink
        to="/wishlist"
        className={({ isActive }) => `mobile-bottom-nav__item${isActive ? ' mobile-bottom-nav__item--active' : ''}`}
      >
        <Icon icon={Heart} size={ICON.md} />
        <span>Saved</span>
      </NavLink>
      <NavLink
        to={user ? '/profile' : '/login'}
        className={({ isActive }) => `mobile-bottom-nav__item${isActive ? ' mobile-bottom-nav__item--active' : ''}`}
        onClick={(e) => {
          if (!user) {
            e.preventDefault();
            navigate('/login');
          }
        }}
      >
        <Icon icon={User} size={ICON.md} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
