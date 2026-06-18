import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Edit, Plus, Star, Trash2 } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmModal from '../../components/ConfirmModal';
import Modal from '../../components/Modal';
import HostListingCard, { isListingIncomplete } from '../../components/host/HostListingCard';
import { Icon, ICON } from '../../components/ui/Icon';
import { HostHero, HostKpi, HostKpiGrid, HostPage, HostPanel } from '../../components/host/HostPageLayout';
import { formatCurrency, roomsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

export default function ManageRooms() {
  const { user } = useAuth();
  const hostId = user?.id || user?._id;

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionRoom, setActionRoom] = useState(null);
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

  const summary = useMemo(() => {
    const live = rooms.filter((r) => r.is_available).length;
    const drafts = rooms.filter((r) => !r.is_available || isListingIncomplete(r)).length;
    const rated = rooms.filter((r) => r.avg_rating);
    const avgRating = rated.length
      ? rated.reduce((sum, r) => sum + Number(r.avg_rating), 0) / rated.length
      : 0;
    const avgPrice = rooms.length
      ? rooms.reduce((sum, r) => sum + (r.price_per_night || 0), 0) / rooms.length
      : 0;
    return { live, drafts, avgRating, avgPrice };
  }, [rooms]);

  const toggleAvailability = async (room) => {
    const roomId = room._id || room.id;
    const next = !room.is_available;
    setError('');
    try {
      await roomsApi.update(roomId, { is_available: next });
      setRooms((prev) => prev.map((r) => (
        (r._id || r.id) === roomId ? { ...r, is_available: next } : r
      )));
    } catch (err) {
      setError(err.normalized?.message || 'Could not update availability');
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
      setActionRoom(null);
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
        subtitle="Update pricing, photos, availability, and GST-ready listing details."
        pills={[`${rooms.length} listing${rooms.length === 1 ? '' : 's'}`, `${summary.live} live`]}
        actions={(
          <Link to="/host/rooms/add" className="host-dashboard__action host-dashboard__action--primary">
            <Icon icon={Plus} size={ICON.sm} /> Add room
          </Link>
        )}
      />

      <HostKpiGrid>
        <HostKpi icon={Building2} variant="bookings" label="Live listings" value={summary.live} hint={`${summary.drafts} need work`} />
        <HostKpi icon={Star} variant="rating" label="Avg rating" value={summary.avgRating ? summary.avgRating.toFixed(1) : '—'} hint="Across live rooms" />
        <HostKpi icon={Building2} variant="earnings" label="Avg nightly rate" value={formatCurrency(summary.avgPrice)} hint="Portfolio average" />
        <HostKpi icon={Building2} variant="occupancy" label="Total listings" value={rooms.length} hint="Including drafts" />
      </HostKpiGrid>

      <ErrorMessage message={error} onRetry={load} />

      <HostPanel title="Your listings" subtitle="Each card opens the listing editor. Publish drafts to appear in guest search.">
        {rooms.length === 0 ? (
          <div className="host-dashboard__empty">
            <h3 style={{ margin: '0 0 0.5rem' }}>No rooms yet</h3>
            <p>Add your first listing with photos, GST pricing, and house rules.</p>
            <Link to="/host/rooms/add" className="btn btn-primary" style={{ marginTop: '1rem' }}>Add room</Link>
          </div>
        ) : (
          <div className="host-listings-grid">
            {rooms.map((room) => (
              <HostListingCard
                key={room._id || room.id}
                room={room}
                onAction={setActionRoom}
              />
            ))}
          </div>
        )}
      </HostPanel>

      {actionRoom && (
        <Modal open onClose={() => setActionRoom(null)} title={actionRoom.title || 'Listing options'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link
              to={`/host/rooms/${actionRoom._id || actionRoom.id}/editor`}
              className="btn btn-outline btn-sm"
              onClick={() => setActionRoom(null)}
            >
              <Icon icon={Edit} size={ICON.sm} /> Open editor
            </Link>
            <Link
              to={`/host/rooms/edit/${actionRoom._id || actionRoom.id}`}
              className="btn btn-outline btn-sm"
              onClick={() => setActionRoom(null)}
            >
              Quick edit
            </Link>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                toggleAvailability(actionRoom);
                setActionRoom(null);
              }}
            >
              {actionRoom.is_available ? 'Unpublish' : 'Publish listing'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setDeleteTarget(actionRoom._id || actionRoom.id);
                setActionRoom(null);
              }}
            >
              <Icon icon={Trash2} size={ICON.sm} /> Delete
            </button>
          </div>
        </Modal>
      )}

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
