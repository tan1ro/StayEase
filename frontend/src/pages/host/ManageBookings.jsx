import { useEffect, useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';
import CheckInVerificationCard from '../../components/CheckInVerificationCard';
import Modal from '../../components/Modal';
import { hostPayout, hostPlatformFee } from '../../components/HostPayoutBreakdown';
import { bookingsApi, formatCurrency } from '../../api/api';

const FILTERS = ['', 'confirmed', 'completed', 'cancelled'];

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkInBooking, setCheckInBooking] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { scope: 'hosting', ...(filter ? { status_filter: filter } : {}) };
      const { data } = await bookingsApi.list(params);
      setBookings(data);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const exportCsv = () => {
    const headers = ['Tourist', 'Check-in', 'Check-out', 'Subtotal', 'Host fee', 'Your earnings', 'Guest paid', 'GST', 'Status'];
    const rows = bookings.map((b) => [
      b.guest_name, b.check_in_date, b.check_out_date,
      b.subtotal, hostPlatformFee(b), hostPayout(b), b.total_price, b.gst_amount, b.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings.csv';
    a.click();
  };

  if (loading) return <Spinner label="Loading bookings..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="page-title">Manage Bookings</h1>
        <button type="button" className="btn btn-outline btn-sm" onClick={exportCsv}>Export CSV</button>
      </div>
      <div className="tabs">
        {['All', 'Upcoming', 'Completed', 'Cancelled'].map((label, i) => (
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
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tourist</th>
              <th>Room</th>
              <th>Dates</th>
              <th>Subtotal</th>
              <th>Host fee</th>
              <th>Your earnings</th>
              <th>Guest paid</th>
              <th>GST</th>
              <th>Status</th>
              <th>Check-in</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id}>
                <td>{b.guest_name}</td>
                <td>{b.room_id?.slice(-6)}</td>
                <td>{b.check_in_date} → {b.check_out_date}</td>
                <td>{formatCurrency(b.subtotal)}</td>
                <td className="text-danger">-{formatCurrency(hostPlatformFee(b))}</td>
                <td><strong>{formatCurrency(hostPayout(b))}</strong></td>
                <td>{formatCurrency(b.total_price)}</td>
                <td>{formatCurrency(b.gst_amount)}</td>
                <td><StatusBadge status={b.status} /></td>
                <td>
                  {b.check_in_verification ? (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setCheckInBooking(b)}
                    >
                      <ShieldCheck size={14} /> Verify
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <a href={`/api/bookings/${b._id}/invoice`} className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer">
                    <Download size={14} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!checkInBooking}
        onClose={() => setCheckInBooking(null)}
        title="Check-in verification"
        size="md"
      >
        {checkInBooking && <CheckInVerificationCard booking={checkInBooking} showBooker />}
      </Modal>
    </div>
  );
}
