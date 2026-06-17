import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  Globe,
  Heart,
  HelpCircle,
  Home,
  LogOut,
  MessageCircle,
  Plane,
  Settings,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Icon, ICON } from './ui/Icon';

export default function UserMenu() {
  const { user, logout, canAccessHostPortal } = useAuth();
  const [open, setOpen] = useState(false);
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
    setOpen(false);
    navigate('/');
  };

  const menuItems = [
    { to: '/wishlist', icon: Heart, label: 'Wishlists' },
    { to: '/bookings', icon: Plane, label: 'Trips' },
    { disabled: true, icon: MessageCircle, label: 'Messages' },
    { to: '/profile', icon: User, label: 'Profile' },
    { divider: true },
    { disabled: true, icon: Bell, label: 'Notifications' },
    { to: canAccessHostPortal ? '/host/settings' : '/settings', icon: Settings, label: 'Account settings' },
    { disabled: true, icon: Globe, label: 'Languages & currency (INR)' },
    { disabled: true, icon: HelpCircle, label: 'Help Centre' },
    { divider: true },
    canAccessHostPortal
      ? { to: '/', icon: Home, label: 'Switch to tourist' }
      : { to: '/register?as=host', icon: Home, label: 'Become a host' },
    ...(canAccessHostPortal
      ? [{ to: '/host', icon: Building2, label: 'Switch to host' }]
      : []),
    { divider: true },
    { action: handleLogout, icon: LogOut, label: 'Log out' },
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
                <button key={item.label} type="button" className="user-menu__item" onClick={item.action}>
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
    </div>
  );
}
