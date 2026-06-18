import { Link } from 'react-router-dom';
import { Calendar, MessageCircle } from 'lucide-react';
import { Icon, ICON } from './ui/Icon';

function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function InquiryInbox({
  inquiries,
  scope,
  loading,
  error,
  onRetry,
}) {
  if (loading) return null;

  if (error) {
    return (
      <div className="inquiry-inbox__error">
        <p>{error}</p>
        {onRetry && (
          <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!inquiries.length) {
    return (
      <div className="empty-state empty-state--fill">
        <Icon icon={MessageCircle} size={ICON.xl} />
        <p>{scope === 'received' ? 'No guest messages yet.' : 'No messages yet.'}</p>
        <p className="inquiry-inbox__empty-hint">
          {scope === 'received'
            ? 'When guests message you from a listing, their inquiries appear here.'
            : 'Message a host from any listing page before you book.'}
        </p>
        {scope === 'sent' && (
          <Link to="/" className="btn btn-primary">Browse stays</Link>
        )}
      </div>
    );
  }

  return (
    <div className="inquiry-inbox">
      {inquiries.map((item) => (
        <article key={item._id} className="inquiry-card card">
          <div className="inquiry-card__header">
            <div>
              <h2 className="inquiry-card__title">
                {item.room_title ? (
                  <Link to={`/rooms/${item.room_id}`}>{item.room_title}</Link>
                ) : (
                  'Listing inquiry'
                )}
              </h2>
              <p className="inquiry-card__meta">
                {scope === 'received' ? (
                  <>From <strong>{item.guest_name || 'Guest'}</strong></>
                ) : (
                  <>To <strong>{item.host_name || 'Host'}</strong></>
                )}
                {item.room_city ? ` · ${item.room_city}` : ''}
              </p>
            </div>
            <time className="inquiry-card__time" dateTime={item.created_at}>
              {formatWhen(item.created_at)}
            </time>
          </div>

          {(item.check_in || item.check_out) && (
            <p className="inquiry-card__dates">
              <Icon icon={Calendar} size={ICON.sm} />
              {item.check_in || '—'} → {item.check_out || '—'}
            </p>
          )}

          <p className="inquiry-card__message">{item.message}</p>

          {scope === 'received' && item.guest_email && (
            <p className="inquiry-card__contact">
              Reply via email: <a href={`mailto:${item.guest_email}`}>{item.guest_email}</a>
            </p>
          )}

          <div className="inquiry-card__actions">
            <Link to={`/rooms/${item.room_id}`} className="btn btn-outline btn-sm">
              View listing
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
