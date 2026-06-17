import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Grid, LayoutGrid, Plus } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import HostListingCard, { isListingIncomplete } from '../../components/host/HostListingCard';
import PublishDetailsModal from '../../components/host/PublishDetailsModal';
import { Icon, ICON } from '../../components/ui/Icon';
import { roomsApi } from '../../api/api';
import { isValidRoomId } from '../../utils/roomId';
import { useAuth } from '../../context/AuthContext';

export default function ManageRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishModal, setPublishModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await roomsApi.byHost(user.id || user._id);
      const validRooms = data.filter((room) => isValidRoomId(room._id));
      setRooms(validRooms);
      const incomplete = validRooms.find(isListingIncomplete);
      if (incomplete) setPublishModal(incomplete._id);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const draftCount = useMemo(() => rooms.filter((r) => !r.is_available).length, [rooms]);

  if (loading) return <Spinner label="Loading listings..." />;

  return (
    <div className="host-page host-listings">
      <header className="host-page__header">
        <h1>Your listings</h1>
        <div className="host-page__header-actions">
          <button type="button" className="host-icon-btn" aria-label="Grid view">
            <Icon icon={LayoutGrid} size={ICON.md} />
          </button>
          <Link to="/host/rooms/add" className="host-icon-btn host-icon-btn--primary" aria-label="Create listing">
            <Icon icon={Plus} size={ICON.md} />
          </Link>
        </div>
      </header>

      <ErrorMessage message={error} onRetry={load} />

      {draftCount > 0 && (
        <button
          type="button"
          className="host-alert-banner"
          onClick={() => setPublishModal(rooms.find(isListingIncomplete)?._id)}
        >
          <span className="host-alert-banner__dot" />
          <div>
            <strong>Confirm a few key details</strong>
            <p>Required to publish {draftCount} listing{draftCount > 1 ? 's' : ''}</p>
          </div>
        </button>
      )}

      {rooms.length === 0 ? (
        <div className="host-empty">
          <Icon icon={Grid} size={48} />
          <h2>No listings yet</h2>
          <p>Create your first StayEase listing with GST-ready pricing and Indian hospitality settings.</p>
          <Link to="/host/rooms/add" className="btn btn-primary">Create listing</Link>
        </div>
      ) : (
        <div className="host-listings__grid">
          {rooms.map((room) => (
            <HostListingCard
              key={room._id}
              room={room}
              onAction={(r) => setPublishModal(isListingIncomplete(r) ? r._id : null)}
            />
          ))}
        </div>
      )}

      <PublishDetailsModal
        open={!!publishModal}
        onClose={() => setPublishModal(null)}
        roomId={publishModal}
      />
    </div>
  );
}
