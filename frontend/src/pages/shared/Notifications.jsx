import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import { notificationsApi } from '../../api/api';
import { Icon, ICON } from '../../components/ui/Icon';

function formatWhen(sentAt) {
  if (!sentAt) return '';
  const d = new Date(sentAt);
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await notificationsApi.list();
      setItems(data);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    try {
      const { data } = await notificationsApi.markRead(id);
      setItems((prev) => prev.map((n) => (n._id === id ? data : n)));
    } catch (err) {
      setError(err.normalized?.message || 'Could not mark notification as read');
    }
  };

  const unread = items.filter((n) => !n.read).length;

  if (loading) return <Spinner label="Loading notifications..." />;

  return (
    <div className="page-narrow">
      <header className="notification-page-header">
        <Icon icon={Bell} size={ICON.lg} />
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Notifications</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {unread > 0 ? `${unread} unread` : 'You are all caught up'}
          </p>
        </div>
      </header>

      <ErrorMessage message={error} onRetry={load} />

      {items.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <Icon icon={Bell} size={40} />
          <h2 style={{ marginTop: '1rem' }}>No notifications yet</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Booking updates, offers, and account alerts will appear here.
          </p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse stays</Link>
        </div>
      ) : (
        <ul className="notification-list">
          {items.map((n) => (
            <li key={n._id} className={`card notification-item ${n.read ? '' : 'notification-item--unread'}`}>
              <div>
                <strong>{n.title}</strong>
                <p style={{ margin: '0.35rem 0', color: 'var(--text-secondary)' }}>{n.body}</p>
                <small style={{ color: 'var(--text-muted)' }}>
                  {n.channel} · {formatWhen(n.sent_at)}
                </small>
              </div>
              {!n.read && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => markRead(n._id)}>
                  <Icon icon={Check} size={ICON.sm} /> Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
