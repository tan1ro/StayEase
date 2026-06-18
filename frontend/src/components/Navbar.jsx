import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import SearchBar from './SearchBar';
import MobileSearchTrigger from './MobileSearchTrigger';
import MobileSearchModal from './MobileSearchModal';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import { useAuth } from '../context/AuthContext';
import { useBecomeHost } from '../hooks/useBecomeHost';

export default function Navbar({ showSearch = false, onSearch }) {
  const { canAccessHostPortal: isHostAccount, isAuthenticated } = useAuth();
  const becomeHost = useBecomeHost();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const isHostRoute = location.pathname.startsWith('/host');
  const isHome = location.pathname === '/';
  const showTouristSearch = showSearch && !isHostRoute;

  const handleBecomeHost = async (e) => {
    e.preventDefault();
    await becomeHost();
  };

  return (
    <>
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
              isAuthenticated ? (
                <button type="button" className="navbar__host-link hide-mobile" onClick={handleBecomeHost}>
                  Become a Host
                </button>
              ) : (
                <Link to="/register?as=host" className="navbar__host-link hide-mobile">
                  Become a Host
                </Link>
              )
            )}
            {isHostRoute && isHostAccount && (
              <Link to="/" className="navbar__host-link hide-mobile">
                Switch to guest
              </Link>
            )}
            {!isHostRoute && isHostAccount && (
              <Link to="/host" className="navbar__host-link hide-mobile">
                Switch to host
              </Link>
            )}
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>

        {showTouristSearch && (
          <div className="navbar__mobile-search hide-desktop">
            <MobileSearchTrigger onOpen={() => setSearchOpen(true)} />
          </div>
        )}
      </header>

      <MobileSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
