import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { bookingsApi, formatCurrency } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const FILTERS = ['', 'confirmed', 'completed', 'cancelled'];
const TAB_LABELS = ['All', 'Confirmed', 'Completed', 'Cancelled'];

export default function ManageBookings() {
  const { user } = useAuth();
  const hostId = user?.id || user?._id;
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    if (!hostId) return;
    setLoading(true);
    setError('');
    try {
      const params = {
        host_id: hostId,
        ...(filter ? { status_filter: filter } : {}),
      };
      const { data } = await bookingsApi.list(params);
      setBookings(data || []);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, hostId]);

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

  if (loading) return <Spinner label="Loading bookings..." />;

  return (
    <div className="host-page">
      <h1 className="page-title">Bookings</h1>

      <div className="tabs">
        {TAB_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`tab ${filter === FILTERS[i] ? 'tab--active' : ''}`}
            onClick={() => setFilter(FILTERS[i])}
          >
            {label}
          </button>
        ))}
      </div>

      <ErrorMessage message={error} onRetry={load} />

      {bookings.length === 0 ? (
        <p className="host-page__subtitle">No bookings found.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Nights</th>
                <th>Amount</th>
                <th>GST</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id || b.id}>
                  <td>{b.guest_name}</td>
                  <td>{b.room_title || b.room_id?.slice(-6)}</td>
                  <td>{b.check_in_date}</td>
                  <td>{b.check_out_date}</td>
                  <td>{b.total_nights ?? '—'}</td>
                  <td>{formatCurrency(b.subtotal)}</td>
                  <td>{formatCurrency(b.gst_amount)}</td>
                  <td>{formatCurrency(b.total_price)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    {b.status === 'confirmed' && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setCancelId(b._id || b.id)}
                        aria-label="Cancel booking"
                      >
                        <X size={14} /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!cancelId}
        title="Cancel booking?"
        message="This will cancel the booking and apply the cancellation policy."
        confirmLabel={cancelling ? 'Cancelling…' : 'Cancel booking'}
        onConfirm={confirmCancel}
        onClose={() => !cancelling && setCancelId(null)}
      />
    </div>
  );
}
