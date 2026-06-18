import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  Globe,
  Heart,
  HelpCircle,
  LogOut,
  MessageCircle,
  Plane,
  Settings,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBecomeHost } from '../hooks/useBecomeHost';
import LogoutConfirmModal from './LogoutConfirmModal';
import { Icon, ICON } from './ui/Icon';

export default function UserMenu() {
  const { user, logout, canAccessHostPortal, isAuthenticated } = useAuth();
  const becomeHost = useBecomeHost();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) {
    return (
      <div className="user-menu-auth">
        <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
        <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    setLogoutOpen(false);
    setOpen(false);
    navigate('/');
  };

  const handleBecomeHost = async () => {
    setUpgrading(true);
    try {
      setOpen(false);
      await becomeHost();
    } finally {
      setUpgrading(false);
    }
  };

  const menuItems = [
    { to: '/wishlist', icon: Heart, label: 'Wishlists' },
    { to: '/bookings', icon: Plane, label: 'Trips' },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/settings', icon: User, label: 'Profile' },
    { divider: true },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/settings#locale', icon: Globe, label: 'Languages & currency' },
    { to: '/settings', icon: Settings, label: 'Account settings' },
    { to: '/help', icon: HelpCircle, label: 'Help Centre' },
    ...(!canAccessHostPortal
      ? isAuthenticated
        ? [{ divider: true }, { action: handleBecomeHost, icon: Building2, label: upgrading ? 'Upgrading…' : 'Become a host', disabled: upgrading }]
        : [{ divider: true }, { to: '/register?as=host', icon: Building2, label: 'Become a host' }]
      : []),
    { divider: true },
    { action: () => { setOpen(false); setLogoutOpen(true); }, icon: LogOut, label: 'Log out' },
  ];

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Icon icon={User} size={ICON.md} />
        <span className="hide-mobile">{user.name?.split(' ')[0]}</span>
      </button>
      {open && (
        <div className="user-menu__dropdown">
          {menuItems.map((item, index) => {
            if (item.divider) {
              return <hr key={`divider-${index}`} className="user-menu__divider" />;
            }
            if (item.action) {
              return (
                <button
                  key={item.label}
                  type="button"
                  className="user-menu__item"
                  onClick={item.action}
                  disabled={item.disabled}
                >
                  <Icon icon={item.icon} size={ICON.md} /> {item.label}
                </button>
              );
            }
            if (item.disabled) {
              return (
                <span key={item.label} className="user-menu__item user-menu__item--disabled">
                  <Icon icon={item.icon} size={ICON.md} /> {item.label}
                </span>
              );
            }
            return (
              <Link key={item.label} to={item.to} className="user-menu__item" onClick={() => setOpen(false)}>
                <Icon icon={item.icon} size={ICON.md} /> {item.label}
              </Link>
            );
          })}
        </div>
      )}
      <LogoutConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
