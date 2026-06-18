import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Logo from '../Logo';
import ThemeToggle from '../ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { Icon, ICON } from '../ui/Icon';
import { HOST_MAIN_NAV } from '../../constants/hostNav';

export default function HostTopNav({ onMenuOpen }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'H';

  return (
    <header className="host-topnav">
      <div className="host-topnav__inner">
        <Logo to="/host" />

        <nav className="host-topnav__tabs hide-mobile" aria-label="Host navigation">
          {HOST_MAIN_NAV.map(({ to, label, match }) => (
            <Link
              key={to}
              to={to}
              className={`host-topnav__tab ${match(pathname) ? 'host-topnav__tab--active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="host-topnav__actions">
          <Link to="/" className="host-topnav__switch">Switch to guest</Link>
          <ThemeToggle />
          <button type="button" className="host-topnav__avatar" aria-label="Open host menu" onClick={onMenuOpen}>
            {initial}
          </button>
          <button type="button" className="host-topnav__menu-btn hide-desktop" onClick={onMenuOpen} aria-label="Menu">
            <Icon icon={Menu} size={ICON.lg} />
          </button>
        </div>
      </div>
    </header>
  );
}
