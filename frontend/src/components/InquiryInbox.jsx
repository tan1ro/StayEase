import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MessageCircle, Send } from 'lucide-react';
import { inquiriesApi } from '../api/api';
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

function buildConversation(inquiry) {
  const original = {
    sender_role: 'guest',
    sender_name: inquiry.guest_name || 'Guest',
    message: inquiry.message,
    created_at: inquiry.created_at,
  };
  const replies = (inquiry.replies || []).map((reply) => ({ ...reply }));
  return [...[original], ...replies].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

function ConversationThread({ inquiry, scope }) {
  const messages = useMemo(() => buildConversation(inquiry), [inquiry]);

  return (
    <div className="inquiry-thread" role="log" aria-label="Conversation">
      {messages.map((msg, index) => {
        const isGuest = msg.sender_role === 'guest';
        const isOwn = scope === 'sent' ? isGuest : !isGuest;
        const label = isGuest
          ? (scope === 'sent' && isOwn ? 'You' : msg.sender_name || 'Guest')
          : (scope === 'received' && isOwn ? 'You' : msg.sender_name || 'Host');

        return (
          <div
            key={`${msg.created_at}-${index}`}
            className={`inquiry-thread__item inquiry-thread__item--${isGuest ? 'guest' : 'host'}${isOwn ? ' inquiry-thread__item--own' : ''}`}
          >
            <div className="inquiry-thread__meta">
              <strong>{label}</strong>
              <time dateTime={msg.created_at}>{formatWhen(msg.created_at)}</time>
            </div>
            <p>{msg.message}</p>
          </div>
        );
      })}
    </div>
  );
}

function InquiryReplyForm({ inquiryId, scope, onSent }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const isGuestView = scope === 'sent';
  const label = isGuestView ? 'Your message' : 'Your reply';
  const placeholder = isGuestView
    ? 'Ask a follow-up question or share more details for the host…'
    : 'Thanks for reaching out! Here is what you need to know…';
  const buttonLabel = isGuestView ? 'Send message' : 'Send reply';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 1) {
      setError('Write a message before sending');
      return;
    }
    setSending(true);
    setError('');
    try {
      await inquiriesApi.reply(inquiryId, { message: trimmed });
      setMessage('');
      onSent?.();
    } catch (err) {
      setError(err.normalized?.message || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="inquiry-reply-form" onSubmit={handleSubmit}>
      <label className="label" htmlFor={`reply-${inquiryId}`}>{label}</label>
      <textarea
        id={`reply-${inquiryId}`}
        className="textarea inquiry-reply-form__input"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        maxLength={1000}
        disabled={sending}
      />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn-primary btn-sm inquiry-reply-form__send" disabled={sending}>
        <Icon icon={Send} size={ICON.sm} />
        {sending ? 'Sending…' : buttonLabel}
      </button>
    </form>
  );
}

export default function InquiryInbox({
  inquiries,
  scope,
  loading,
  error,
  onRetry,
  onReplied,
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
        <p>{scope === 'received' ? 'No guest messages yet.' : 'No conversations yet.'}</p>
        <p className="inquiry-inbox__empty-hint">
          {scope === 'received'
            ? 'When guests message you from a listing, their inquiries appear here.'
            : 'Message a host from any listing page to start a conversation before you book.'}
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
                  <>With <strong>{item.host_name || 'Host'}</strong></>
                )}
                {item.room_city ? ` · ${item.room_city}` : ''}
              </p>
            </div>
            <time className="inquiry-card__time" dateTime={item.created_at}>
              Started {formatWhen(item.created_at)}
            </time>
          </div>

          {(item.check_in || item.check_out) && (
            <p className="inquiry-card__dates">
              <Icon icon={Calendar} size={ICON.sm} />
              {item.check_in || '—'} → {item.check_out || '—'}
            </p>
          )}

          <ConversationThread inquiry={item} scope={scope} />

          <InquiryReplyForm inquiryId={item._id} scope={scope} onSent={onReplied} />

          <div className="inquiry-card__actions">
            <Link to={`/rooms/${item.room_id}`} className="btn btn-outline btn-sm">
              View listing
            </Link>
            {scope === 'sent' && item.room_id && (
              <Link
                to={`/book/${item.room_id}${item.check_in ? `?check_in=${item.check_in}&check_out=${item.check_out || ''}` : ''}`}
                className="btn btn-primary btn-sm"
              >
                Book this room
              </Link>
            )}
            {scope === 'received' && item.guest_email && (
              <a href={`mailto:${item.guest_email}`} className="btn btn-ghost btn-sm">
                Email guest
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
