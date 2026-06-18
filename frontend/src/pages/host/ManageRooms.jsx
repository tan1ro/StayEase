import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Edit, Plus, Star, Trash2 } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmModal from '../../components/ConfirmModal';
import SafeImage from '../../components/SafeImage';
import { Icon, ICON } from '../../components/ui/Icon';
import {
  HostEmpty,
  HostHero,
  HostKpi,
  HostKpiGrid,
  HostPage,
  HostPanel,
} from '../../components/host/HostPageLayout';
import { formatCurrency, roomsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { getPrimaryRoomImage } from '../../utils/roomImages';
import {
  getListingResumeLabel,
  getListingResumePath,
  isDraftListing,
  pickMostRecentDraft,
} from '../../utils/listingResume';

function roomNumberLabel(room) {
  const num = String(room?.room_number || '').trim();
  if (!num) return null;
  if (num.length > 10) return `Room ${num.slice(0, 10)}…`;
  return `Room ${num}`;
}

export default function ManageRooms() {
  const { user } = useAuth();
  const hostId = user?.id || user?._id;
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const load = async () => {
    if (!hostId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await roomsApi.byHost(hostId);
      setRooms(data || []);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [hostId]);

  const toggleAvailability = async (room) => {
    const roomId = room._id || room.id;
    setTogglingId(roomId);
    setError('');
    try {
      await roomsApi.update(roomId, { is_available: !room.is_available });
      setRooms((prev) => prev.map((r) => (
        (r._id || r.id) === roomId ? { ...r, is_available: !room.is_available } : r
      )));
    } catch (err) {
      setError(err.normalized?.message || 'Could not update availability');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteRoom = async (roomId) => {
    setError('');
    try {
      await roomsApi.remove(roomId);
      setDeleteTarget(null);
      setRooms((prev) => prev.filter((r) => (r._id || r.id) !== roomId));
    } catch (err) {
      setError(err.normalized?.message || 'Could not delete room');
    }
  };

  if (loading) return <Spinner label="Loading rooms..." />;

  const live = rooms.filter((r) => r.is_available).length;
  const recentDraft = pickMostRecentDraft(rooms);
  const avgRating = rooms.length
    ? (rooms.reduce((s, r) => s + (r.avg_rating || 0), 0) / rooms.length).toFixed(1)
    : '—';

  return (
    <HostPage>
      <HostHero
        title="Listings"
        subtitle="Manage room numbers, pricing, availability, and photos across your property."
        pills={[`${rooms.length} total`, `${live} live`]}
        actions={(
          <Link to="/host/rooms/add" className="host-dashboard__action host-dashboard__action--primary">
            <Icon icon={Plus} size={ICON.sm} /> Add room
          </Link>
        )}
      />

      <HostKpiGrid>
        <HostKpi icon={BedDouble} variant="bookings" label="Live listings" value={live} hint={`${rooms.length - live} draft`} />
        <HostKpi icon={Star} variant="rating" label="Avg rating" value={avgRating} hint="Across all rooms" />
        <HostKpi
          icon={BedDouble}
          variant="occupancy"
          label="Lowest price"
          value={rooms.length ? formatCurrency(Math.min(...rooms.map((r) => r.price_per_night))) : '—'}
          hint="Per night"
        />
        <HostKpi
          icon={BedDouble}
          variant="earnings"
          label="Highest price"
          value={rooms.length ? formatCurrency(Math.max(...rooms.map((r) => r.price_per_night))) : '—'}
          hint="Premium room rate"
        />
      </HostKpiGrid>

      <ErrorMessage message={error} onRetry={load} />

      {recentDraft && (
        <div className="host-dashboard__draft-banner">
          <div>
            <strong>Listing in progress</strong>
            <p>Pick up where you left off — your draft is saved automatically.</p>
          </div>
          <Link
            to={getListingResumePath(recentDraft._id || recentDraft.id)}
            className="btn btn-primary btn-sm"
          >
            {getListingResumeLabel(recentDraft)}
          </Link>
        </div>
      )}

      <HostPanel title="Your rooms" subtitle={`${rooms.length} listing${rooms.length !== 1 ? 's' : ''}`}>
        {rooms.length === 0 ? (
          <HostEmpty
            title="No rooms yet"
            description="Add your first room to start receiving bookings on StayEase."
            action={<Link to="/host/rooms/add" className="btn btn-primary">Add room</Link>}
          />
        ) : (
          <div className="host-dashboard__rank-list">
            {rooms.map((room) => {
              const roomId = room._id || room.id;
              const photo = getPrimaryRoomImage(room);
              const label = roomNumberLabel(room);
              return (
                <article key={roomId} className="host-listing-row">
                  <div className="host-listing-row__media">
                    <SafeImage
                      src={photo}
                      alt={room.title || 'Room photo'}
                      className="safe-image"
                      fallbackSeed={roomId}
                    />
                  </div>
                  <div className="host-listing-row__body">
                    <h3 className="host-listing-row__title">{room.title || `${room.room_category} room`}</h3>
                    <div className="host-listing-row__meta">
                      {label && <span>{label}</span>}
                      <span>{room.room_category}</span>
                      <span>{formatCurrency(room.price_per_night)}/night</span>
                      <span>{room.avg_rating?.toFixed(1) || '—'} ★</span>
                      <span className={`host-listing-row__badge ${room.is_available ? 'host-listing-row__badge--live' : 'host-listing-row__badge--draft'}`}>
                        {room.is_available ? 'Live' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <div className="host-listing-row__actions">
                    {isDraftListing(room) ? (
                      <Link
                        to={getListingResumePath(roomId)}
                        className="btn btn-primary btn-sm"
                      >
                        Continue setup
                      </Link>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={togglingId === roomId}
                          onClick={() => toggleAvailability(room)}
                        >
                          Pause
                        </button>
                        <Link to={`/host/rooms/edit/${roomId}`} className="btn btn-ghost btn-sm" aria-label="Edit">
                          <Icon icon={Edit} size={ICON.sm} />
                        </Link>
                      </>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDeleteTarget(roomId)}
                      aria-label="Delete"
                    >
                      <Icon icon={Trash2} size={ICON.sm} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </HostPanel>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete room?"
        message="This listing will be permanently removed. Active bookings may prevent deletion."
        confirmLabel="Delete"
        onConfirm={() => deleteRoom(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
    </HostPage>
  );
}
