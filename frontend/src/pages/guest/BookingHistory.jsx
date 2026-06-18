import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpDown,
  Download,
  LayoutGrid,
  LayoutList,
  Plane,
  Search,
  Star,
  X,
} from 'lucide-react';
import {
  bookingsApi,
  formatCurrency,
  roomsApi,
  submitReview,
  waitlistApi,
} from '../../api/api';
import CancellationModal from '../../components/CancellationModal';
import ErrorMessage from '../../components/ErrorMessage';
import NotificationBanner from '../../components/NotificationBanner';
import SafeImage from '../../components/SafeImage';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import StarRating from '../../components/StarRating';
import { Icon, ICON } from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { getPrimaryRoomImage } from '../../utils/roomImages';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { value: 'check_in_desc', label: 'Check-in (newest)' },
  { value: 'check_in_asc', label: 'Check-in (oldest)' },
  { value: 'price_desc', label: 'Price (high to low)' },
  { value: 'price_asc', label: 'Price (low to high)' },
  { value: 'title_asc', label: 'Room name (A–Z)' },
  { value: 'status', label: 'Status' },
];

function sortBookings(list, sortKey, roomMap) {
  const copy = [...list];
  switch (sortKey) {
    case 'check_in_asc':
      return copy.sort((a, b) => a.check_in_date.localeCompare(b.check_in_date));
    case 'price_desc':
      return copy.sort((a, b) => (b.total_price || 0) - (a.total_price || 0));
    case 'price_asc':
      return copy.sort((a, b) => (a.total_price || 0) - (b.total_price || 0));
    case 'title_asc':
      return copy.sort((a, b) => {
        const ta = (a.room_title || roomMap[a.room_id]?.title || '').toLowerCase();
        const tb = (b.room_title || roomMap[b.room_id]?.title || '').toLowerCase();
        return ta.localeCompare(tb);
      });
    case 'status':
      return copy.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
    default:
      return copy.sort((a, b) => b.check_in_date.localeCompare(a.check_in_date));
  }
}

function BookingMeta({ booking, room, nights, title, roomNumber }) {
  return (
    <>
      <div className="booking-trip-meta__title">
        <strong>{title}</strong>
        {roomNumber && <span className="listing-muted"> · Room {roomNumber}</span>}
      </div>
      <p className="listing-muted" style={{ marginTop: '0.2rem', fontSize: '0.85rem' }}>
        {booking.check_in_date} → {booking.check_out_date} · {nights} night{nights !== 1 ? 's' : ''}
      </p>
      <p style={{ marginTop: '0.2rem', fontSize: '0.9rem' }}>
        <strong>{formatCurrency(booking.total_price)}</strong>
        {booking.gst_amount != null && (
          <span className="listing-muted"> · GST {formatCurrency(booking.gst_amount)}</span>
        )}
      </p>
      {booking.has_review && <span className="booking-reviewed-note">Reviewed</span>}
      {booking.status === 'cancelled' && booking.refund_amount != null && (
        <span className="booking-refund-note">Refund: {formatCurrency(booking.refund_amount)}</span>
      )}
    </>
  );
}

function BookingActions({
  booking,
  inlineReviewId,
  reviewForm,
  reviewError,
  reviewSubmitting,
  onCancel,
  onOpenReview,
  onCloseReview,
  onReviewChange,
  onSubmitReview,
}) {
  return (
    <div className="booking-trip-row__actions">
      {booking.status === 'completed' && booking.can_review && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onOpenReview}>
          <Star size={14} /> Review
        </button>
      )}
      <Link to={`/receipt/${booking._id}`} className="btn btn-outline btn-sm">
        <Download size={14} /> Invoice
      </Link>
      {booking.status === 'confirmed' ? (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          <X size={14} /> Cancel
        </button>
      ) : (
        <span className="booking-trip-row__action-spacer" aria-hidden="true" />
      )}
      {inlineReviewId === booking._id && (
        <div className="card" style={{ padding: '0.75rem', marginTop: '0.5rem', width: '100%' }}>
          <StarRating
            value={reviewForm.rating}
            onChange={(v) => onReviewChange((f) => ({ ...f, rating: v }))}
          />
          <input
            className="input"
            placeholder="Review title"
            value={reviewForm.title}
            onChange={(e) => onReviewChange((f) => ({ ...f, title: e.target.value }))}
            style={{ marginTop: '0.5rem' }}
          />
          <textarea
            className="textarea"
            rows={2}
            placeholder="Your review"
            value={reviewForm.body}
            onChange={(e) => onReviewChange((f) => ({ ...f, body: e.target.value }))}
            style={{ marginTop: '0.5rem' }}
          />
          <label style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={reviewForm.wouldRecommend}
              onChange={(e) => onReviewChange((f) => ({ ...f, wouldRecommend: e.target.checked }))}
            />
            {' '}Would recommend
          </label>
          {reviewError && <p className="form-error">{reviewError}</p>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            {reviewSubmitting ? (
              <Spinner size={24} label="" />
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={onSubmitReview}>
                Submit
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCloseReview}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingHistory() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [roomMap, setRoomMap] = useState({});
  const [waitlistNotify, setWaitlistNotify] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('check_in_desc');
  const [viewMode, setViewMode] = useState('list');
  const [cancelId, setCancelId] = useState(null);
  const [inlineReviewId, setInlineReviewId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '', wouldRecommend: true });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const load = async () => {
    if (!user?.id && !user?._id) return;
    const guestId = user.id || user._id;
    setLoading(true);
    setError('');
    try {
      const [bookingsRes, waitlistRes] = await Promise.all([
        bookingsApi.list({ guest_id: guestId }),
        user.phone ? waitlistApi.byPhone(user.phone).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      const list = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
      setBookings(list);

      const notifyEntries = (waitlistRes.data || []).filter((e) => e.status === 'notify');
      setWaitlistNotify(notifyEntries);

      const roomIds = [...new Set(list.map((b) => b.room_id).filter(Boolean))];
      const roomEntries = await Promise.all(
        roomIds.map((rid) =>
          roomsApi.get(rid).then(({ data }) => [rid, data]).catch(() => [rid, null]),
        ),
      );
      setRoomMap(Object.fromEntries(roomEntries));
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id, user?.phone]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = bookings.filter((b) => {
      if (activeTab !== 'all' && b.status !== activeTab) return false;
      if (!q) return true;
      const room = roomMap[b.room_id];
      const guestName = (b.guest_name || b.check_in_verification?.staying_guest_name || '').toLowerCase();
      const roomNumber = (room?.room_number || '').toLowerCase();
      const roomTitle = (b.room_title || room?.title || '').toLowerCase();
      return guestName.includes(q) || roomNumber.includes(q) || roomTitle.includes(q);
    });
    return sortBookings(matched, sortBy, roomMap);
  }, [bookings, activeTab, search, sortBy, roomMap]);

  const submitInlineReview = async (booking) => {
    setReviewSubmitting(true);
    setReviewError('');
    try {
      await submitReview({
        booking_id: booking._id,
        rating: reviewForm.rating,
        title: reviewForm.title.trim(),
        body: reviewForm.body.trim(),
        would_recommend: reviewForm.wouldRecommend,
        photos: [],
      });
      setInlineReviewId(null);
      setReviewForm({ rating: 5, title: '', body: '', wouldRecommend: true });
      load();
    } catch (err) {
      setReviewError(err.normalized?.message || 'Could not submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const actionProps = (b) => ({
    booking: b,
    inlineReviewId,
    reviewForm,
    reviewError,
    reviewSubmitting,
    onCancel: () => setCancelId(b._id),
    onOpenReview: () => {
      setInlineReviewId(b._id);
      setReviewError('');
    },
    onCloseReview: () => setInlineReviewId(null),
    onReviewChange: setReviewForm,
    onSubmitReview: () => submitInlineReview(b),
  });

  if (loading) {
    return (
      <div className="page">
        <Spinner label="Loading trips..." />
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">My Trips</h1>
      <ErrorMessage message={error} onRetry={load} />

      {waitlistNotify.map((entry) => {
        const room = roomMap[entry.room_id];
        const label = room?.title || room?.room_number || 'A room';
        return (
          <NotificationBanner
            key={entry._id || entry.id}
            body={`${label} is now available! Book now →`}
            actionLabel="Book now"
            onAction={() => {
              window.location.href = `/rooms/${entry.room_id}`;
            }}
          />
        );
      })}

      {bookings.length > 0 && (
        <>
          <div className="tabs" style={{ marginBottom: '1rem' }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tab${activeTab === tab.id ? ' tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            className="filter-toolbar"
            style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}
          >
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180, maxWidth: 360 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.5,
                  pointerEvents: 'none',
                }}
              />
              <input
                id="booking-search"
                className="input"
                style={{ paddingLeft: '2.25rem', width: '100%' }}
                placeholder="Search guest or room"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search trips"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                type="button"
                className={`filter-toolbar__btn${viewMode === 'list' ? ' filter-toolbar__btn--active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <LayoutList size={16} />
              </button>
              <button
                type="button"
                className={`filter-toolbar__btn${viewMode === 'grid' ? ' filter-toolbar__btn--active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            <div className="filter-toolbar__sort">
              <Icon icon={ArrowUpDown} size={ICON.sm} />
              <select
                className="filter-toolbar__select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort trips"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="listing-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            {filtered.length} trip{filtered.length !== 1 ? 's' : ''}
          </p>
        </>
      )}

      {bookings.length === 0 ? (
        <div className="empty-state empty-state--fill">
          <Icon icon={Plane} size={ICON.xl} />
          <p>No bookings yet. Find a room →</p>
          <Link to="/" className="btn btn-primary">Find a room</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No trips match your search.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {filtered.map((b) => {
            const room = roomMap[b.room_id];
            const image = getPrimaryRoomImage(room || { _id: b.room_id, photos: room?.photos });
            const nights = b.total_nights ?? 1;
            const title = b.room_title || room?.title || 'Stay';
            const roomNumber = room?.room_number;

            return (
              <article
                key={b._id}
                className="card"
                style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                <div style={{ position: 'relative' }}>
                  <SafeImage
                    src={image}
                    alt={title}
                    fallbackSeed={b.room_id}
                    style={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                  />
                  <div className="booking-trip-grid-badge">
                    <StatusBadge status={b.status} className="booking-trip-status" />
                  </div>
                </div>
                <BookingMeta
                  booking={b}
                  room={room}
                  nights={nights}
                  title={title}
                  roomNumber={roomNumber}
                />
                <BookingActions {...actionProps(b)} />
              </article>
            );
          })}
        </div>
      ) : (
        <div className="booking-trip-list">
          {filtered.map((b) => {
            const room = roomMap[b.room_id];
            const image = getPrimaryRoomImage(room || { _id: b.room_id, photos: room?.photos });
            const nights = b.total_nights ?? 1;
            const title = b.room_title || room?.title || 'Stay';
            const roomNumber = room?.room_number;

            return (
              <article key={b._id} className="card booking-trip-row">
                <div className="booking-trip-row__thumb">
                  <SafeImage
                    src={image}
                    alt={title}
                    fallbackSeed={b.room_id}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div className="booking-trip-row__body">
                  <BookingMeta
                    booking={b}
                    room={room}
                    nights={nights}
                    title={title}
                    roomNumber={roomNumber}
                  />
                </div>
                <div className="booking-trip-row__aside">
                  {b.status && (
                    <StatusBadge status={b.status} className="booking-trip-status" />
                  )}
                  <BookingActions {...actionProps(b)} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      <style>{`
        .booking-trip-meta__title {
          min-width: 0;
          line-height: 1.35;
        }
        .booking-trip-status {
          flex-shrink: 0;
          font-size: 0.78rem !important;
          padding: 0.3rem 0.7rem !important;
          font-weight: 700 !important;
          letter-spacing: 0.02em;
          line-height: 1.2;
          align-self: flex-end;
        }
        .booking-trip-list .badge--success,
        .booking-trip-status.badge--success {
          background: rgba(16, 185, 129, 0.22) !important;
          color: #10b981 !important;
          border: 1px solid rgba(16, 185, 129, 0.5) !important;
        }
        html.dark .booking-trip-list .badge--success,
        html.dark .booking-trip-status.badge--success {
          background: rgba(16, 185, 129, 0.25) !important;
          color: #6ee7b7 !important;
          border-color: rgba(110, 231, 183, 0.5) !important;
        }
        .booking-trip-list .badge--danger,
        .booking-trip-status.badge--danger {
          background: rgba(239, 68, 68, 0.18) !important;
          color: #dc2626 !important;
          border: 1px solid rgba(239, 68, 68, 0.45) !important;
        }
        html.dark .booking-trip-list .badge--danger,
        html.dark .booking-trip-status.badge--danger {
          background: rgba(239, 68, 68, 0.25) !important;
          color: #fca5a5 !important;
          border-color: rgba(252, 165, 165, 0.5) !important;
        }
        .booking-trip-list .badge--warning,
        .booking-trip-status.badge--warning {
          background: rgba(245, 158, 11, 0.18) !important;
          color: #d97706 !important;
          border: 1px solid rgba(245, 158, 11, 0.45) !important;
        }
        html.dark .booking-trip-list .badge--warning,
        html.dark .booking-trip-status.badge--warning {
          color: #fcd34d !important;
        }
        .booking-trip-grid-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 1;
        }
        .booking-trip-grid-badge .booking-trip-status {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        }
        .booking-trip-list {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .booking-trip-row {
          display: grid;
          grid-template-columns: 72px minmax(0, 1fr) 132px;
          gap: 0.875rem 1rem;
          align-items: center;
          padding: 0.75rem 1rem;
        }
        .booking-trip-row__thumb {
          width: 72px;
          height: 54px;
          border-radius: 8px;
          overflow: hidden;
          background: var(--border);
          flex-shrink: 0;
          align-self: center;
        }
        .booking-trip-row__body {
          min-width: 0;
          align-self: center;
        }
        .booking-trip-row__aside {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: center;
          gap: 0.5rem;
          width: 132px;
          flex-shrink: 0;
        }
        .booking-trip-row__actions {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0.35rem;
          width: 100%;
        }
        .booking-trip-row__actions .btn-sm {
          width: 100%;
          justify-content: center;
          white-space: nowrap;
        }
        .booking-trip-row__action-spacer {
          display: block;
          min-height: 32px;
        }
        @media (max-width: 640px) {
          .booking-trip-row {
            grid-template-columns: 64px minmax(0, 1fr);
            grid-template-areas:
              "thumb body"
              "thumb aside";
            align-items: start;
          }
          .booking-trip-row__thumb {
            width: 64px;
            height: 48px;
            grid-area: thumb;
          }
          .booking-trip-row__body {
            grid-area: body;
          }
          .booking-trip-row__aside {
            grid-area: aside;
            width: 100%;
            flex-direction: row;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.5rem;
          }
          .booking-trip-status {
            align-self: auto;
          }
          .booking-trip-row__actions {
            flex-direction: row;
            flex-wrap: wrap;
            width: auto;
            flex: 1;
          }
          .booking-trip-row__actions .btn-sm {
            width: auto;
          }
          .booking-trip-row__action-spacer {
            display: none;
          }
        }
      `}</style>

      <CancellationModal
        open={!!cancelId}
        bookingId={cancelId}
        onClose={() => setCancelId(null)}
        onCancelled={load}
      />
    </div>
  );
}
