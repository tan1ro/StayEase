import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, IndianRupee, Users, X } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import Badge from '../../components/Badge';
import ConfirmModal from '../../components/ConfirmModal';
import {
  HostHero,
  HostKpi,
  HostKpiGrid,
  HostPage,
  HostPanel,
  HostTabs,
} from '../../components/host/HostPageLayout';
import { bookingsApi, formatCurrency } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { formatStatusLabel } from '../../utils/statusBadge';

const FILTERS = ['', 'confirmed', 'completed', 'cancelled'];
const TAB_LABELS = ['All', 'Confirmed', 'Completed', 'Cancelled'];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function statusBadgeVariant(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'confirmed') return 'success';
  if (value === 'cancelled') return 'default';
  if (value === 'completed') return 'primary';
  return 'default';
}

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
      const params = { host_id: hostId, ...(filter ? { status_filter: filter } : {}) };
      const { data } = await bookingsApi.list(params);
      setBookings(data || []);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, hostId]);

  const summary = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const revenue = bookings
      .filter((b) => b.status !== 'cancelled' && b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.host_payout ?? b.subtotal ?? b.total_price ?? 0), 0);
    const gst = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.gst_amount ?? 0), 0);
    const guests = new Set(bookings.map((b) => b.guest_id || b.guest_email).filter(Boolean)).size;
    return { confirmed, revenue, gst, guests };
  }, [bookings]);

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
    <HostPage>
      <HostHero
        title="Bookings"
        subtitle="Manage guest reservations, GST invoices, and cancellations."
        pills={[`${bookings.length} reservation${bookings.length === 1 ? '' : 's'}`, `${summary.confirmed} confirmed`]}
      />

      <HostKpiGrid>
        <HostKpi icon={Users} variant="bookings" label="Unique guests" value={summary.guests} hint="In this view" />
        <HostKpi icon={Calendar} variant="occupancy" label="Confirmed" value={summary.confirmed} hint="Active stays" />
        <HostKpi icon={IndianRupee} variant="earnings" label="Host earnings" value={formatCurrency(summary.revenue)} hint="Paid bookings" />
        <HostKpi icon={IndianRupee} variant="rating" label="GST on bookings" value={formatCurrency(summary.gst)} hint="CGST + SGST" />
      </HostKpiGrid>

      <HostTabs
        tabs={TAB_LABELS.map((label, i) => ({ id: FILTERS[i], label }))}
        active={filter}
        onChange={setFilter}
      />

      <ErrorMessage message={error} onRetry={load} />

      <HostPanel title="Reservation list" subtitle="Tap a row on mobile to see all booking details.">
        {bookings.length === 0 ? (
          <div className="host-dashboard__empty">
            <h3 style={{ margin: '0 0 0.5rem' }}>No bookings yet</h3>
            <p>When guests book your listings, reservations and GST breakdowns will show up here.</p>
            <Link to="/host/rooms" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>Review listings</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table trips-table">
              <thead>
                <tr>
                  <th>Guest</th>
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
                {bookings.map((b) => {
                  const bookingId = b._id || b.id;
                  return (
                    <tr key={bookingId}>
                      <td data-label="Guest">{b.guest_name || '—'}</td>
                      <td data-label="Room">{b.room_title || b.room_id || '—'}</td>
                      <td className="trips-table__dates" data-label="Check-in">{formatDate(b.check_in_date)}</td>
                      <td className="trips-table__dates" data-label="Check-out">{formatDate(b.check_out_date)}</td>
                      <td data-label="Nights">{b.total_nights ?? '—'}</td>
                      <td data-label="Amount">{formatCurrency(b.subtotal ?? b.total_price)}</td>
                      <td data-label="GST">{formatCurrency(b.gst_amount ?? 0)}</td>
                      <td data-label="Total">{formatCurrency(b.total_price)}</td>
                      <td data-label="Status">
                        <Badge variant={statusBadgeVariant(b.status)}>
                          {formatStatusLabel(b.status)}
                        </Badge>
                      </td>
                      <td className="trips-table__actions-cell" data-label="Actions">
                        {b.status === 'confirmed' && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setCancelId(bookingId)}
                          >
                            <X size={14} /> Cancel
                          </button>
                        )}
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
        open={!!cancelId}
        title="Cancel booking?"
        message="This will cancel the booking and apply the cancellation policy."
        confirmLabel={cancelling ? 'Cancelling…' : 'Cancel booking'}
        onConfirm={confirmCancel}
        onClose={() => !cancelling && setCancelId(null)}
      />
    </HostPage>
  );
}
