import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/api';
import ErrorMessage from '../../components/ErrorMessage';

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

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const [active, setActive] = useState(SECTIONS[0]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [emailPrefs, setEmailPrefs] = useState(true);
  const [whatsappPrefs, setWhatsappPrefs] = useState(false);
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

  const handleSave = async (e) => {
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

  const renderComingSoon = (title, body) => (
    <section className="card" style={{ padding: '1.5rem', maxWidth: 720 }}>
      <h2 style={{ marginBottom: '0.5rem' }}>{title}</h2>
      <p style={{ marginBottom: '1rem' }}>{body}</p>
      <div className="badge badge-soft">Coming soon for all tourists</div>
    </section>
  );

  const renderContent = () => {
    if (active === 'Personal information') {
      return (
        <form onSubmit={handleSave} className="card" style={{ padding: '1.5rem', maxWidth: 720 }}>
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

          <div className="form-group">
            <label className="label">Notifications</label>
            <label style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="checkbox" checked={emailPrefs} onChange={(e) => setEmailPrefs(e.target.checked)} />
              Email updates about trips and offers
            </label>
            <label style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                checked={whatsappPrefs}
                onChange={(e) => setWhatsappPrefs(e.target.checked)}
              />
              WhatsApp trip updates and alerts
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      );
    }

    if (active === 'Login & security') {
      return renderComingSoon(
        'Login & security',
        'Change your password, manage login methods, and see where you are logged in. This will be available soon.',
      );
    }
    if (active === 'Privacy & sharing') {
      return renderComingSoon(
        'Privacy & sharing',
        'Control what profile details are visible to hosts and how your activity is used to personalize StayEase.',
      );
    }
    if (active === 'Notifications') {
      return renderComingSoon(
        'Notifications',
        'Choose exactly which emails, SMS, and WhatsApp messages you receive for trips, offers, and account alerts.',
      );
    }
    if (active === 'Taxes') {
      return renderComingSoon(
        'Taxes',
        'Download tax summaries and add GST details for your receipts. Tourist tax tools are coming soon.',
      );
    }
    if (active === 'Payments & payouts') {
      return renderComingSoon(
        'Payments & payouts',
        'Manage saved cards and UPI handles for faster checkout and refunds.',
      );
    }
    if (active === 'Travel preferences') {
      return renderComingSoon(
        'Travel preferences',
        'Set default preferences like food type, smoking policy, and room type so we can tailor your search results.',
      );
    }
    return renderComingSoon(
      'Travel for work',
      'Keep work trips separate, share invoices with your team, and add company details. Business travel features are on the roadmap.',
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
              onClick={() => setActive(item)}
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

