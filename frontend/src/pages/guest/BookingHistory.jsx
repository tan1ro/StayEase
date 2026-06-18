import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Search } from 'lucide-react';
import { bookingsApi, roomsApi, waitlistApi } from '../../api/api';
import ConfirmModal from '../../components/ConfirmModal';
import ErrorMessage from '../../components/ErrorMessage';
import Spinner from '../../components/Spinner';
import TripBookingCard from '../../components/TripBookingCard';
import TripsTable from '../../components/TripsTable';
import TripsViewToggle from '../../components/TripsViewToggle';
import WriteReviewModal from '../../components/WriteReviewModal';
import { HostTabs } from '../../components/host/HostPageLayout';
import { Icon, ICON } from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { sortTrips, tripSearchHaystack } from '../../utils/tripBooking';

const FILTERS = ['', 'confirmed', 'completed', 'cancelled'];
const TAB_LABELS = ['All', 'Confirmed', 'Completed', 'Cancelled'];
const VIEW_KEY = 'stayease_trips_view';

function loadViewMode() {
  try {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === 'list' || saved === 'grid') return saved;
    if (saved === 'compact') return 'grid';
  } catch {
    /* ignore */
  }
  return 'list';
}

export default function BookingHistory() {
  const { user } = useAuth();
  const guestId = user?.id || user?._id;

  const [bookings, setBookings] = useState([]);
  const [roomMap, setRoomMap] = useState({});
  const [notifyWaitlist, setNotifyWaitlist] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [viewMode, setViewMode] = useState(loadViewMode);
  const [sortBy, setSortBy] = useState('booked_desc');

  const handleViewChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const load = useCallback(async () => {
    if (!guestId) return;
    setLoading(true);
    setError('');
    try {
      const params = { guest_id: guestId, ...(filter ? { status_filter: filter } : {}) };
      const { data } = await bookingsApi.list(params);
      const list = data || [];
      setBookings(list);

      const roomIds = [...new Set(list.map((b) => b.room_id).filter(Boolean))];
      const rooms = await Promise.all(
        roomIds.map(async (roomId) => {
          try {
            const { data: room } = await roomsApi.get(roomId);
            return [roomId, room];
          } catch {
            return [roomId, null];
          }
        }),
      );
      setRoomMap(Object.fromEntries(rooms));

      if (user?.phone) {
        try {
          const { data: waitlistItems } = await waitlistApi.byPhone(user.phone);
          setNotifyWaitlist((waitlistItems || []).filter((item) => item.status === 'notify'));
        } catch {
          setNotifyWaitlist([]);
        }
      } else {
        setNotifyWaitlist([]);
      }
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [filter, guestId, user?.phone]);

  useEffect(() => { load(); }, [load]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? bookings.filter((b) => tripSearchHaystack(b, roomMap[b.room_id]).includes(q))
      : bookings;
    return sortTrips(list, sortBy);
  }, [bookings, roomMap, search, sortBy]);

  const confirmCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    setError('');
    try {
      await bookingsApi.cancel(cancelId);
      setCancelId(null);
      await load();
    } catch (err) {
      setError(err.normalized?.message || 'Could not cancel booking');
    } finally {
      setCancelling(false);
    }
  };

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

      {notifyWaitlist.length > 0 && (
        <div className="host-alert-banner" role="alert" style={{ marginBottom: '1rem' }}>
          <span className="host-alert-banner__dot" aria-hidden="true" />
          <div>
            {notifyWaitlist.map((item) => (
              <p key={item._id || item.id}>
                <strong>Room {item.room_number || item.room_id?.slice(-6) || 'available'} is now available!</strong>{' '}
                <Link to={`/rooms/${item.room_id}`}>Book now →</Link>
              </p>
            ))}
          </div>
        </div>
      )}

      <HostTabs
        tabs={TAB_LABELS.map((label, i) => ({ id: FILTERS[i], label }))}
        active={filter}
        onChange={setFilter}
      />

      <div className="trips-toolbar">
        <div className="form-group trips-toolbar__search">
          <label className="label" htmlFor="trip-search">Search trips</label>
          <div className="trips-toolbar__search-wrap">
            <Search
              size={16}
              className="trips-toolbar__search-icon"
              aria-hidden="true"
            />
            <input
              id="trip-search"
              className="input"
              placeholder="Guest name or room number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <TripsViewToggle value={viewMode} onChange={handleViewChange} />
      </div>

      <ErrorMessage message={error} onRetry={load} />

      {filteredBookings.length === 0 ? (
        <div className="empty-state empty-state--fill">
          <Icon icon={Plane} size={ICON.xl} />
          <p>No bookings yet.</p>
          <Link to="/" className="btn btn-primary">Find a room →</Link>
        </div>
      ) : viewMode === 'list' ? (
        <TripsTable
          bookings={filteredBookings}
          roomMap={roomMap}
          sortBy={sortBy}
          onSort={setSortBy}
          onReview={setReviewBooking}
          onCancel={setCancelId}
        />
      ) : (
        <div className="trips-layout trips-layout--grid">
          {filteredBookings.map((b) => (
            <TripBookingCard
              key={b._id || b.id}
              booking={b}
              room={roomMap[b.room_id]}
              onReview={setReviewBooking}
              onCancel={setCancelId}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!cancelId}
        title="Cancel booking?"
        message="This will cancel your reservation. Refunds follow the listing cancellation policy."
        confirmLabel={cancelling ? 'Cancelling…' : 'Cancel booking'}
        onConfirm={confirmCancel}
        onClose={() => !cancelling && setCancelId(null)}
        error={cancelling ? '' : undefined}
      />

      <WriteReviewModal
        open={!!reviewBooking}
        booking={reviewBooking}
        roomTitle={reviewBooking?.room_title}
        onClose={() => setReviewBooking(null)}
        onSubmitted={load}
      />
    </div>
  );
}
