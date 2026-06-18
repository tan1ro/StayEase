import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Download, Plane, Star, X } from 'lucide-react';
import { bookingsApi, formatCurrency } from '../../api/api';
import CancellationModal from '../../components/CancellationModal';
import ErrorMessage from '../../components/ErrorMessage';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import WriteReviewModal from '../../components/WriteReviewModal';
import { Icon, ICON } from '../../components/ui/Icon';
import { formatRangeLabel } from '../../utils/dates';

function formatGuests(count) {
  if (count == null || Number.isNaN(Number(count))) return '—';
  const n = Number(count);
  return `${n} guest${n === 1 ? '' : 's'}`;
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelId, setCancelId] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await bookingsApi.list({ scope: 'traveling' });
      setBookings(data);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
      {bookings.length === 0 ? (
        <div className="empty-state empty-state--fill">
          <Icon icon={Plane} size={ICON.xl} />
          <p>No trips yet.</p>
          <Link to="/" className="btn btn-primary">Browse stays</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table trips-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Dates</th>
                <th>Guests</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td className="trips-table__room">
                    <span className="trips-table__room-title">
                      {b.room_title || `Room ${b.room_id?.slice(-6) || b.room_id}`}
                    </span>
                  </td>
                  <td className="trips-table__dates">
                    {formatRangeLabel(b.check_in_date, b.check_out_date) || '—'}
                  </td>
                  <td className="trips-table__guests">{formatGuests(b.num_guests)}</td>
                  <td className="trips-table__total">{formatCurrency(b.total_price)}</td>
                  <td>
                    <div className="trips-table__status">
                      <StatusBadge status={b.status} />
                      {b.has_review && (
                        <span className="booking-reviewed-note">Reviewed</span>
                      )}
                      {b.status === 'cancelled' && b.refund_amount != null && (
                        <span className="booking-refund-note">
                          Refund: {formatCurrency(b.refund_amount)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="trips-table__actions">
                      {b.can_review && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setReviewBooking(b)}
                        >
                          <Star size={14} /> Rate hotel
                        </button>
                      )}
                      {b.payment_status === 'pending' && b.status === 'confirmed' && (
                        <Link to={`/receipt/${b._id}`} className="btn btn-primary btn-sm">
                          <CreditCard size={14} /> Pay now
                        </Link>
                      )}
                      <Link to={`/receipt/${b._id}`} className="btn btn-outline btn-sm">
                        <Download size={14} /> Receipt
                      </Link>
                      {b.status === 'confirmed' && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCancelId(b._id)}>
                          <X size={14} /> Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CancellationModal
        open={!!cancelId}
        bookingId={cancelId}
        onClose={() => setCancelId(null)}
        onCancelled={load}
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
