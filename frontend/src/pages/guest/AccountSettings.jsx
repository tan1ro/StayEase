import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { analyticsApi, authApi, bookingsApi, formatCurrency } from '../../api/api';
import ErrorMessage from '../../components/ErrorMessage';
import IdentityVerification from '../../components/IdentityVerification';

const TRAVEL_PREFS_KEY = 'stayease_travel_prefs';

const SECTIONS = [
  'Personal information',
  'Login & security',
  'Privacy & sharing',
  'Notifications',
  'Taxes',
  'Payments & payouts',
  'Travel preferences',
  'Travel for work',
];

const DEFAULT_TRAVEL_PREFS = {
  food: '',
  smoking: '',
  alcohol: '',
  roomCategory: '',
};

function loadTravelPrefs() {
  try {
    return { ...DEFAULT_TRAVEL_PREFS, ...JSON.parse(localStorage.getItem(TRAVEL_PREFS_KEY) || '{}') };
  } catch {
    return { ...DEFAULT_TRAVEL_PREFS };
  }
}

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const [active, setActive] = useState(SECTIONS[0]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [emailPrefs, setEmailPrefs] = useState(true);
  const [whatsappPrefs, setWhatsappPrefs] = useState(false);
  const [travelPrefs, setTravelPrefs] = useState(loadTravelPrefs);
  const [taxSummary, setTaxSummary] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAbout(user.about_me || '');
      setEmailPrefs(user.notification_prefs?.email ?? true);
      setWhatsappPrefs(user.notification_prefs?.whatsapp ?? false);
    }
  }, [user]);

  useEffect(() => {
    if (active === 'Taxes') {
      analyticsApi.guestDashboard()
        .then(({ data }) => setTaxSummary(data))
        .catch(() => setTaxSummary(null));
    }
    if (active === 'Payments & payouts') {
      bookingsApi.list()
        .then(({ data }) => setRecentBookings(data.slice(0, 5)))
        .catch(() => setRecentBookings([]));
    }
  }, [active]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('phone', phone);
      fd.append('about_me', about);
      fd.append('notification_prefs', JSON.stringify({ email: emailPrefs, whatsapp: whatsappPrefs }));
      await authApi.updateProfile(fd);
      await refreshUser();
      setSuccess('Settings updated');
    } catch (err) {
      setError(err.normalized?.message || 'Could not update settings');
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationPrefs = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      fd.append('notification_prefs', JSON.stringify({ email: emailPrefs, whatsapp: whatsappPrefs }));
      await authApi.updateProfile(fd);
      await refreshUser();
      setSuccess('Notification preferences saved');
    } catch (err) {
      setError(err.normalized?.message || 'Could not save preferences');
    } finally {
      setLoading(false);
    }
  };

  const saveTravelPrefs = (e) => {
    e.preventDefault();
    localStorage.setItem(TRAVEL_PREFS_KEY, JSON.stringify(travelPrefs));
    setSuccess('Travel preferences saved for search defaults');
    setError('');
  };

  const panel = (title, children) => (
    <section className="card" style={{ padding: '1.5rem', maxWidth: 720 }}>
      <h2 style={{ marginBottom: '0.5rem' }}>{title}</h2>
      {children}
    </section>
  );

  const renderContent = () => {
    if (active === 'Personal information') {
      return (
        <form onSubmit={saveProfile} className="card" style={{ padding: '1.5rem', maxWidth: 720 }}>
          <h2 style={{ marginBottom: '1rem' }}>Personal information</h2>
          <p style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
            Update your basic profile details and how StayEase contacts you.
          </p>
          <ErrorMessage message={error} />
          {success && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{success}</p>}

          <div className="form-group">
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input" value={user?.email || ''} disabled />
          </div>
          <div className="form-group">
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">About you</label>
            <textarea className="textarea" value={about} onChange={(e) => setAbout(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      );
    }

    if (active === 'Login & security') {
      return panel(
        'Login & security',
        <>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Manage how you sign in and verify your identity for bookings.
          </p>
          <ErrorMessage message={error} />
          <ul style={{ paddingLeft: '1.25rem', marginBottom: '1rem' }}>
            <li>Email: <strong>{user?.email}</strong> {user?.email_verified ? '(verified)' : '(not verified)'}</li>
            <li>Phone: <strong>{user?.phone || 'Not set'}</strong></li>
          </ul>
          <IdentityVerification verified={user?.email_verified} onSuccess={refreshUser} />
          <p style={{ marginTop: '1rem' }}>
            <Link to="/verify-identity" className="btn btn-outline btn-sm">
              <Shield size={14} style={{ marginRight: 6 }} /> Upload ID proof
            </Link>
          </p>
        </>,
      );
    }

    if (active === 'Privacy & sharing') {
      return panel(
        'Privacy & sharing',
        <>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Control how your data is used and review StayEase policies.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/cookie-policy">Cookie Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/help/nondiscrimination">Nondiscrimination Policy</Link></li>
          </ul>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            For data access or deletion requests, email{' '}
            <a href="mailto:privacy@stayease.com">privacy@stayease.com</a>.
          </p>
        </>,
      );
    }

    if (active === 'Notifications') {
      return (
        <form onSubmit={saveNotificationPrefs} className="card" style={{ padding: '1.5rem', maxWidth: 720 }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Notifications</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Choose how StayEase reaches you about trips, offers, and account alerts.
          </p>
          <ErrorMessage message={error} />
          {success && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{success}</p>}
          <label style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input type="checkbox" checked={emailPrefs} onChange={(e) => setEmailPrefs(e.target.checked)} />
            Email updates about trips and offers
          </label>
          <label style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="checkbox" checked={whatsappPrefs} onChange={(e) => setWhatsappPrefs(e.target.checked)} />
            WhatsApp trip updates and alerts
          </label>
          <p style={{ marginTop: '1rem' }}>
            <Link to="/notifications">View in-app notifications</Link>
          </p>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Saving…' : 'Save preferences'}
          </button>
        </form>
      );
    }

    if (active === 'Taxes') {
      return panel(
        'Taxes',
        <>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            GST on hotel stays is calculated per Indian tariff slabs and shown on every invoice.
          </p>
          {taxSummary ? (
            <div className="stat-cards" style={{ marginBottom: '1rem' }}>
              <div className="stat-card">
                <div className="stat-card__label">Total GST paid</div>
                <div className="stat-card__value">{formatCurrency(taxSummary.total_gst || 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__label">Total spent</div>
                <div className="stat-card__value">{formatCurrency(taxSummary.total_spent || 0)}</div>
              </div>
            </div>
          ) : (
            <p>No trip tax data yet. Complete a booking to see GST summaries here.</p>
          )}
          <Link to="/bookings" className="btn btn-outline btn-sm">View trips & invoices</Link>
        </>,
      );
    }

    if (active === 'Payments & payouts') {
      return panel(
        'Payments & payouts',
        <>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            StayEase uses secure mock checkout for demo bookings. View payment status on your trips.
          </p>
          {recentBookings.length === 0 ? (
            <p>No payments yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Booking</th><th>Total</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b._id}>
                      <td>{b.check_in_date} – {b.check_out_date}</td>
                      <td>{formatCurrency(b.total_price)}</td>
                      <td>{b.payment_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>,
      );
    }

    if (active === 'Travel preferences') {
      return (
        <form onSubmit={saveTravelPrefs} className="card" style={{ padding: '1.5rem', maxWidth: 720 }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Travel preferences</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Defaults applied when you search on the home page.
          </p>
          {success && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{success}</p>}
          <div className="form-group">
            <label className="label">Food preference</label>
            <select className="select" value={travelPrefs.food} onChange={(e) => setTravelPrefs((p) => ({ ...p, food: e.target.value }))}>
              <option value="">Any</option>
              <option value="veg">Vegetarian only</option>
              <option value="nonveg">Non-vegetarian</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Smoking</label>
            <select className="select" value={travelPrefs.smoking} onChange={(e) => setTravelPrefs((p) => ({ ...p, smoking: e.target.value }))}>
              <option value="">Any</option>
              <option value="non_smoking">Non-smoking</option>
              <option value="smoking">Smoking allowed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Room category</label>
            <select className="select" value={travelPrefs.roomCategory} onChange={(e) => setTravelPrefs((p) => ({ ...p, roomCategory: e.target.value }))}>
              <option value="">Any</option>
              {['Single', 'Double', 'Triple', 'Suite', 'Villa', 'Dormitory'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Save preferences</button>
        </form>
      );
    }

    return panel(
      'Travel for work',
      <>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Keep work trips organized with downloadable invoices and GST-ready receipts.
        </p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          <li>Download invoices from <Link to="/bookings">My trips</Link></li>
          <li>Print receipts from any completed booking</li>
          <li>GST breakdown included on every tax invoice</li>
        </ul>
      </>,
    );
  };

  return (
    <div className="host-page host-settings">
      <aside className="host-settings__nav card">
        <h2>Account settings</h2>
        <nav>
          {SECTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`host-settings__nav-item ${active === item ? 'active' : ''}`}
              onClick={() => { setActive(item); setSuccess(''); setError(''); }}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="host-settings__main">
        {renderContent()}
      </main>
    </div>
  );
}
