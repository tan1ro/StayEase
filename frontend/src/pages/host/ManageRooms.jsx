import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Plus, Trash2 } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmModal from '../../components/ConfirmModal';
import SafeImage from '../../components/SafeImage';
import { Icon, ICON } from '../../components/ui/Icon';
import { HostHero, HostPage, HostPanel } from '../../components/host/HostPageLayout';
import { formatCurrency, roomsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { getPrimaryRoomImage } from '../../utils/roomImages';

export default function ManageRooms() {
  const { user } = useAuth();
  const hostId = user?.id || user?._id;

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!hostId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await roomsApi.list({ host_id: hostId });
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
    const next = !room.is_available;
    setTogglingId(roomId);
    setError('');
    try {
      await roomsApi.update(roomId, { is_available: next });
      setRooms((prev) => prev.map((r) => (
        (r._id || r.id) === roomId ? { ...r, is_available: next } : r
      )));
    } catch (err) {
      setError(err.normalized?.message || 'Could not update availability');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteRoom = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await roomsApi.remove(deleteTarget);
      setRooms((prev) => prev.filter((r) => (r._id || r.id) !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.normalized?.message || 'Could not delete room');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Spinner label="Loading rooms..." />;

  return (
    <HostPage>
      <HostHero
        title="Manage rooms"
        subtitle="Update pricing, availability, and listing details."
        pills={[`${rooms.length} room${rooms.length === 1 ? '' : 's'}`]}
        actions={(
          <Link to="/host/rooms/add" className="host-dashboard__action host-dashboard__action--primary">
            <Icon icon={Plus} size={ICON.sm} /> Add room
          </Link>
        )}
      />

      <ErrorMessage message={error} onRetry={load} />

      <HostPanel title="Your listings">
        {rooms.length === 0 ? (
          <div className="host-dashboard__empty">
            No rooms yet. Add your first room.
            <div style={{ marginTop: '1rem' }}>
              <Link to="/host/rooms/add" className="btn btn-primary">Add room</Link>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table trips-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Room #</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Available</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  const roomId = room._id || room.id;
                  const photo = getPrimaryRoomImage(room);
                  return (
                    <tr key={roomId}>
                      <td data-label="Photo">
                        <SafeImage
                          src={photo}
                          alt={room.title || 'Room'}
                          className="safe-image"
                          fallbackSeed={roomId}
                          style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6 }}
                        />
                      </td>
                      <td data-label="Room #">{room.room_number || '—'}</td>
                      <td data-label="Type">{room.room_category || '—'}</td>
                      <td data-label="Price">{formatCurrency(room.price_per_night)}</td>
                      <td data-label="Available">
                        <label className="form-hint" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(room.is_available)}
                            disabled={togglingId === roomId}
                            onChange={() => toggleAvailability(room)}
                            aria-label={`Toggle availability for room ${room.room_number}`}
                          />
                          {room.is_available ? 'Live' : 'Draft'}
                        </label>
                      </td>
                      <td data-label="Rating">{room.avg_rating ? `${Number(room.avg_rating).toFixed(1)} ★` : '—'}</td>
                      <td className="trips-table__actions-cell" data-label="Actions">
                        <div className="trips-table__actions">
                          <Link
                            to={`/host/rooms/edit/${roomId}`}
                            className="btn btn-ghost btn-sm"
                            aria-label="Edit room"
                          >
                            <Icon icon={Edit} size={ICON.sm} />
                          </Link>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setDeleteTarget(roomId)}
                            aria-label="Delete room"
                          >
                            <Icon icon={Trash2} size={ICON.sm} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </HostPanel>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete room?"
        message="This listing will be permanently removed."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={deleteRoom}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </HostPage>
  );
}
