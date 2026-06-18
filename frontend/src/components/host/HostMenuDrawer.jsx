import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Building2,
  CircleHelp,
  Globe,
  Home,
  IndianRupee,
  LogOut,
  Settings,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Icon, ICON } from '../ui/Icon';
import LogoutConfirmModal from '../LogoutConfirmModal';
import HostReferHostModal from './HostReferHostModal';

const MENU_ITEMS = [
  { to: '/', icon: Home, label: 'Switch to guest' },
  { to: '/host/payouts', icon: IndianRupee, label: 'Payouts' },
  { to: '/host/settings', icon: Settings, label: 'Account settings' },
  { to: '/host/settings#locale', icon: Globe, label: 'Languages & currency' },
  { to: '/host/resources', icon: BookOpen, label: 'Hosting resources' },
  { to: '/help', icon: CircleHelp, label: 'Get help' },
  { action: 'refer-host', icon: UserPlus, label: 'Refer a host' },
];

export default function HostMenuDrawer({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [referOpen, setReferOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const handleLogout = () => {
    logout();
    setLogoutOpen(false);
    onClose();
    navigate('/');
  };

  return (
    <>
      {open && createPortal(
        <div className="host-drawer-overlay" onClick={onClose} role="presentation">
          <aside
            className="host-drawer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Host menu"
            role="dialog"
            aria-modal="true"
          >
            <div className="host-drawer__scroll">
              <div className="host-drawer__header">
                <h2>Menu</h2>
                <div className="host-drawer__header-actions">
                  <Link to="/notifications" className="host-drawer__icon-btn" aria-label="Notifications" onClick={onClose}>
                    <Icon icon={Bell} size={ICON.md} />
                  </Link>
                  <button type="button" className="host-drawer__icon-btn" onClick={onClose} aria-label="Close menu">
                    <Icon icon={X} size={ICON.md} />
                  </button>
                </div>
              </div>

              <Link to="/host/rooms/add" className="host-drawer__cta" onClick={onClose}>
                <div className="host-drawer__cta-art" aria-hidden="true">
                  <Icon icon={Building2} size={32} />
                </div>
                <div>
                  <strong>Create a new listing</strong>
                  <p>Host a room on StayEase with GST-ready billing.</p>
                </div>
              </Link>

              <nav className="host-drawer__nav">
                {MENU_ITEMS.map(({ to, action, icon, label, disabled }) => {
                  if (disabled) {
                    return (
                      <span key={label} className="host-drawer__item host-drawer__item--disabled">
                        <Icon icon={icon} size={ICON.md} />
                        {label}
                      </span>
                    );
                  }
                  if (action === 'refer-host') {
                    return (
                      <button
                        key={label}
                        type="button"
                        className="host-drawer__item"
                        onClick={() => {
                          onClose();
                          setReferOpen(true);
                        }}
                      >
                        <Icon icon={icon} size={ICON.md} />
                        {label}
                      </button>
                    );
                  }
                  return (
                    <Link key={label} to={to} className="host-drawer__item" onClick={onClose}>
                      <Icon icon={icon} size={ICON.md} />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="host-drawer__footer">
              <p className="host-drawer__host-name">{user?.name}</p>
              <button
                type="button"
                className="host-drawer__item"
                onClick={() => {
                  onClose();
                  setLogoutOpen(true);
                }}
              >
                <Icon icon={LogOut} size={ICON.md} />
                Log out
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}
      <HostReferHostModal open={referOpen} onClose={() => setReferOpen(false)} />
      <LogoutConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
