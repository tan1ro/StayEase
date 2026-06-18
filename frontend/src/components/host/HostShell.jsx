import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import HostTopNav from './HostTopNav';
import HostMenuDrawer from './HostMenuDrawer';
import HostMobileBottomNav from './HostMobileBottomNav';

export default function HostShell() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="host-shell">
      <HostTopNav onMenuOpen={() => setMenuOpen(true)} />
      <div className="host-shell__content">
        <Outlet />
      </div>
      <HostMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <HostMobileBottomNav />
    </div>
  );
}
