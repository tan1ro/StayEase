import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Plus, Trash2 } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmModal from '../../components/ConfirmModal';
import { Icon, ICON } from '../../components/ui/Icon';
import { formatCurrency, roomsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

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

  return (
    <div className="host-page">
      <header className="host-page__header">
        <h1>Manage rooms</h1>
        <Link to="/host/rooms/add" className="btn btn-primary btn-sm">
          <Icon icon={Plus} size={ICON.sm} /> Add room
        </Link>
      </header>

      <ErrorMessage message={error} onRetry={load} />

      {rooms.length === 0 ? (
        <div className="host-empty">
          <h2>No rooms yet. Add your first room.</h2>
          <Link to="/host/rooms/add" className="btn btn-primary">Add room</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Room#</th>
                <th>Type</th>
                <th>Price</th>
                <th>Availability</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => {
                const roomId = room._id || room.id;
                const photo = room.photos?.find((p) => p.is_primary) || room.photos?.[0];
                return (
                  <tr key={roomId}>
                    <td>
                      {photo ? (
                        <img src={photo.url} alt="" width={48} height={36} style={{ objectFit: 'cover', borderRadius: 8 }} />
                      ) : '—'}
                    </td>
                    <td>{room.room_number}</td>
                    <td>{room.room_category}</td>
                    <td>{formatCurrency(room.price_per_night)}/night</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={togglingId === roomId}
                        onClick={() => toggleAvailability(room)}
                      >
                        {room.is_available ? 'Live' : 'Draft'}
                      </button>
                    </td>
                    <td>{room.avg_rating?.toFixed(1) || '—'} ({room.total_reviews || 0})</td>
                    <td>
                      <Link to={`/host/rooms/edit/${roomId}`} className="btn btn-ghost btn-sm" aria-label="Edit">
                        <Icon icon={Edit} size={ICON.sm} />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeleteTarget(roomId)}
                        aria-label="Delete"
                      >
                        <Icon icon={Trash2} size={ICON.sm} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete room?"
        message="This listing will be permanently removed. Active bookings may prevent deletion."
        confirmLabel="Delete"
        onConfirm={() => deleteRoom(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
