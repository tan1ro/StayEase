import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Icon, ICON } from '../../components/ui/Icon';

export default function HostSettings() {
  const { user } = useAuth();
  const [proTools, setProTools] = useState(false);
  const [profileSlug, setProfileSlug] = useState(user?.name?.toLowerCase().replace(/\s+/g, '-') || '');

  return (
    <div className="host-page host-settings">
      <aside className="host-settings__nav card">
        <h2>Account settings</h2>
        <nav>
          {['Personal information', 'Login & security', 'Notifications', 'Taxes', 'Payments', 'Professional hosting tools'].map((item, i) => (
            <button key={item} type="button" className={`host-settings__nav-item ${i === 5 ? 'active' : ''}`}>
              {item}
              {item === 'Payments' && <span className="host-badge host-badge--new">New</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="host-settings__main">
        <h1>Professional hosting tools</h1>

        <section className="host-settings__card card">
          <div className="host-settings__row">
            <div>
              <strong>Enable professional hosting tools</strong>
              <p>Access GST reports, bulk calendar tools, and multi-listing insights. <a href="#learn">Learn more</a></p>
            </div>
            <button type="button" className="host-settings__toggle" onClick={() => setProTools((v) => !v)} aria-pressed={proTools}>
              <Icon icon={proTools ? ToggleRight : ToggleLeft} size={ICON.xl} />
            </button>
          </div>
        </section>

        <section className="host-settings__card card">
          <strong>Create a custom profile URL</strong>
          <p>Give guests a direct link to all your StayEase listings.</p>
          <div className="host-settings__url-row">
            <span className="host-settings__url-prefix">stayease.in/host/</span>
            <input className="input" value={profileSlug} onChange={(e) => setProfileSlug(e.target.value)} />
            <button type="button" className="btn btn-primary btn-sm">Save</button>
            <button type="button" className="btn btn-outline btn-sm" disabled>Copy</button>
          </div>
        </section>

        <section className="host-settings__card card host-settings__gst">
          <Icon icon={Receipt} size={ICON.lg} />
          <div>
            <strong>GST invoicing</strong>
            <p>StayEase auto-generates CGST/SGST invoices on every paid booking — unique to Indian hotel billing.</p>
            <Link to="/host/earnings" className="btn btn-outline btn-sm">View earnings</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
