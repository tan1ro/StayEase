import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Download, IndianRupee, Users, X } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import {
  HostEmpty,
  HostHero,
  HostKpi,
  HostKpiGrid,
  HostPage,
  HostPanel,
  HostTabs,
} from '../../components/host/HostPageLayout';
import { bookingsApi, formatCurrency } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const FILTERS = ['', 'confirmed', 'completed', 'cancelled'];
const TAB_LABELS = ['All', 'Confirmed', 'Completed', 'Cancelled'];

function formatStayRange(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '—';
  const fmt = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(checkIn)} → ${fmt(checkOut)}`;
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
  const [downloadingId, setDownloadingId] = useState(null);

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

  const handleInvoice = async (bookingId) => {
    setDownloadingId(bookingId);
    setError('');
    try {
      const { data } = await bookingsApi.invoice(bookingId);
      const url = data?.pdf_url || data?.invoice_url;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(err.normalized?.message || 'Could not load invoice');
    } finally {
      setDownloadingId(null);
    }
  };

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

  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const revenue = bookings.reduce((s, b) => s + (b.subtotal || 0), 0);
  const gstTotal = bookings.reduce((s, b) => s + (b.gst_amount || 0), 0);

  return (
    <HostPage>
      <HostHero
        title="Bookings"
        subtitle="Track guest reservations, GST amounts, and cancellation actions."
        pills={[`${bookings.length} shown`, `${confirmed} confirmed`]}
      />

      <HostKpiGrid>
        <HostKpi icon={Users} variant="bookings" label="Bookings" value={bookings.length} hint={TAB_LABELS[FILTERS.indexOf(filter)] || 'Filtered'} />
        <HostKpi icon={IndianRupee} variant="earnings" label="Subtotal" value={formatCurrency(revenue)} hint="Before GST" />
        <HostKpi icon={IndianRupee} variant="occupancy" label="GST" value={formatCurrency(gstTotal)} hint="CGST + SGST" />
        <HostKpi icon={Calendar} variant="rating" label="Confirmed" value={confirmed} hint="Active stays" />
      </HostKpiGrid>

      <HostTabs
        tabs={TAB_LABELS.map((label, i) => ({ id: FILTERS[i], label }))}
        active={filter}
        onChange={setFilter}
      />

      <ErrorMessage message={error} onRetry={load} />

      <HostPanel title="Reservation list" subtitle="Download invoices from each completed booking">
        {bookings.length === 0 ? (
          <HostEmpty title="No bookings found" description="Bookings matching this filter will appear here." />
        ) : (
          <div className="host-dashboard__bookings">
            {bookings.map((b) => (
              <article key={b._id || b.id} className="host-dashboard__booking">
                <div>
                  <div className="host-dashboard__booking-name">{b.guest_name}</div>
                  <div className="host-dashboard__booking-dates">
                    {b.room_title || 'Room'} · {formatStayRange(b.check_in_date, b.check_out_date)} · {b.total_nights ?? '—'} nights
                  </div>
                </div>
                <div>
                  <div className="host-dashboard__booking-amount">{formatCurrency(b.total_price)}</div>
                  <div className="host-dashboard__booking-paid">
                    {formatCurrency(b.subtotal)} + {formatCurrency(b.gst_amount)} GST
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                  <StatusBadge status={b.status} />
                  {(b.status === 'confirmed' || b.status === 'completed') && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleInvoice(b._id || b.id)}
                        disabled={downloadingId === (b._id || b.id)}
                      >
                        <Download size={14} />
                        {downloadingId === (b._id || b.id) ? '…' : 'Invoice'}
                      </button>
                      <Link to={`/receipt/${b._id || b.id}`} className="btn btn-ghost btn-sm">
                        Receipt
                      </Link>
                    </div>
                  )}
                  {b.status === 'confirmed' && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCancelId(b._id || b.id)}>
                      <X size={14} /> Cancel
                    </button>
                  )}
                </div>
              </article>
            ))}
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
