import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import SearchBar from './SearchBar';
import MobileSearchTrigger from './MobileSearchTrigger';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import { useSearchModal } from '../context/SearchModalContext';
import { useAuth } from '../context/AuthContext';
import { canAccessHostPortal } from '../utils/roles';
import { isHostPortalPath } from '../utils/routes';

export default function Navbar({ showSearch = false, onSearch }) {
  const { canAccessHostPortal: isHostAccount } = useAuth();
  const { openSearch } = useSearchModal();
  const location = useLocation();
  const isHostRoute = isHostPortalPath(location.pathname);
  const isHome = location.pathname === '/';
  const showTouristSearch = showSearch && !isHostRoute;

  return (
    <header className={`navbar ${isHome ? 'navbar--home' : ''}`}>
      <div className="navbar__inner">
        <Logo to={isHostRoute ? '/host' : '/'} />

        {showTouristSearch && isHome && (
          <div className="navbar__search navbar__search--centered hide-mobile">
            <SearchBar onSearch={onSearch} />
          </div>
        )}

        {showTouristSearch && !isHome && (
          <div className="navbar__search hide-mobile">
            <SearchBar onSearch={onSearch} compact />
          </div>
        )}

        <div className="navbar__actions">
          {!isHostRoute && !isHostAccount && (
            <Link to="/register?as=host" className="navbar__host-link hide-mobile">
              Become a Host
            </Link>
          )}
          {isHostRoute && isHostAccount && (
            <Link to="/" className="navbar__host-link hide-mobile">
              Switch to Tourist View
            </Link>
          )}
          {!isHostRoute && isHostAccount && (
            <Link to="/host" className="navbar__host-link hide-mobile">
              Switch to Host View
            </Link>
          )}
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {showTouristSearch && (
        <div className="navbar__mobile-search hide-desktop">
          <MobileSearchTrigger onOpen={openSearch} />
        </div>
      )}
    </header>
  );
}
