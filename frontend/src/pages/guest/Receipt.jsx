import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import Logo from '../../components/Logo';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import { fetchBooking, formatCurrency, roomsApi } from '../../api/api';
import { getCancellationSummary } from '../../utils/cancellationTimeline';

const CANCELLATION_RULES = {
  flexible: [
    'Full refund if cancelled at least 24 hours before check-in.',
    '50% refund if cancelled within 24 hours of check-in.',
    'StayEase service fee is non-refundable after confirmation.',
  ],
  moderate: [
    'Full refund if cancelled 5+ days before check-in.',
    '50% refund if cancelled 1–5 days before check-in.',
    'No refund if cancelled within 24 hours of check-in.',
    'StayEase service fee is non-refundable after confirmation.',
  ],
  strict: [
    '50% refund if cancelled 7+ days before check-in.',
    'No refund if cancelled within 7 days of check-in.',
    'StayEase service fee is non-refundable after confirmation.',
  ],
};

function invoiceNumber(booking) {
  const d = (booking?.check_in_date || '').replace(/-/g, '');
  const id = String(booking?._id || booking?.id || '').slice(-6);
  return `INV-${d}-${id}`;
}

function formatInvoiceDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime12(time) {
  if (!time) return '—';
  const [hourStr, minuteStr = '00'] = time.split(':');
  const hour = Number(hourStr);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minuteStr} ${ampm}`;
}

function pctLabel(rate) {
  if (rate == null || rate === 0) return '0%';
  const pct = rate <= 1 ? rate * 100 : rate;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
}

export default function Receipt() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const bookingData = await fetchBooking(id);
        setBooking(bookingData);
        const roomData = await roomsApi.get(bookingData.room_id).then((r) => r.data);
        setRoom(roomData);
      } catch (err) {
        setError(err.normalized?.message || 'Receipt not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Spinner label="Loading receipt..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!booking) return null;

  const gstRate = booking.gst_rate || 0;
  const cgstRate = gstRate / 2;
  const cgstAmount = (booking.gst_amount || 0) / 2;
  const sgstAmount = (booking.gst_amount || 0) / 2;
  const breakdown = booking.price_breakdown || [];
  const feeItems = breakdown.filter((i) => i.type === 'fee');
  const lineItems = breakdown.filter((i) => i.type !== 'fee');
  const cancellationPolicy = room?.policies?.cancellation || 'moderate';
  const cancellationRules = CANCELLATION_RULES[cancellationPolicy] || CANCELLATION_RULES.moderate;
  const checkInTime = room?.policies?.check_in_time || '14:00';
  const checkOutTime = room?.policies?.check_out_time || '11:00';
  const invoiceDate = formatInvoiceDate(booking.created_at || booking.check_in_date);
  const statusLabel = (booking.status || 'confirmed').toUpperCase();

  return (
    <div className="page receipt-page">
      <div
        className="receipt-print-area card"
        style={{ maxWidth: 680, margin: '0 auto', padding: '2rem' }}
      >
        {/* Header with logo */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            marginBottom: '1.5rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <Logo to={null} variant="full" />
            <p className="listing-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
              StayEase Hospitality Pvt. Ltd.<br />
              Koramangala, Bangalore 560034, Karnataka, India<br />
              support@stayease.com · +91 80 4567 8900
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.02em' }}>TAX INVOICE</p>
            <span style={{ color: 'var(--success, #16a34a)', fontWeight: 600, fontSize: '0.9rem' }}>
              {statusLabel} ✓
            </span>
            <p className="listing-muted" style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
              {invoiceNumber(booking)}
            </p>
            <p className="listing-muted" style={{ fontSize: '0.8rem' }}>
              Invoice date: {invoiceDate}
            </p>
            <p className="listing-muted" style={{ fontSize: '0.8rem' }}>
              Booking ID: {booking._id}
            </p>
          </div>
        </header>

        {/* Guest / Room */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Bill To
            </h3>
            <p><strong>{booking.guest_name}</strong></p>
            <p className="listing-muted" style={{ fontSize: '0.85rem' }}>{booking.guest_email}</p>
            <p className="listing-muted" style={{ fontSize: '0.85rem' }}>{booking.guest_phone}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Stay Details
            </h3>
            <p><strong>{room?.title || booking.room_title}</strong></p>
            {room?.room_number && (
              <p className="listing-muted" style={{ fontSize: '0.85rem' }}>Room {room.room_number}</p>
            )}
            {room?.location?.city && (
              <p className="listing-muted" style={{ fontSize: '0.85rem' }}>
                {room.location.area ? `${room.location.area}, ` : ''}{room.location.city}
              </p>
            )}
            <p className="listing-muted" style={{ fontSize: '0.85rem' }}>
              {booking.check_in_date} → {booking.check_out_date}
            </p>
            <p className="listing-muted" style={{ fontSize: '0.85rem' }}>
              {booking.total_nights} night{booking.total_nights !== 1 ? 's' : ''} · Check-in after {formatTime12(checkInTime)} · Checkout before {formatTime12(checkOutTime)}
            </p>
          </div>
        </div>

        {/* Price table */}
        <table className="data-table" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.label}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            <tr>
              <td><strong>Subtotal</strong></td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(booking.subtotal)}</td>
            </tr>
            {feeItems.map((item, idx) => (
              <tr key={`fee-${idx}`}>
                <td>{item.label}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            {booking.guest_platform_fee > 0 && !feeItems.length && (
              <tr>
                <td>StayEase service fee</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(booking.guest_platform_fee)}</td>
              </tr>
            )}
            {gstRate > 0 && (
              <>
                <tr>
                  <td>CGST ({pctLabel(cgstRate)})</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(cgstAmount)}</td>
                </tr>
                <tr>
                  <td>SGST ({pctLabel(cgstRate)})</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(sgstAmount)}</td>
                </tr>
              </>
            )}
            <tr>
              <td><strong>Grand Total (incl. taxes &amp; fees)</strong></td>
              <td style={{ textAlign: 'right', fontSize: '1.1rem' }}>
                <strong>{formatCurrency(booking.total_price)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* QR + GST */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '1.5rem',
            padding: '0.75rem',
            background: 'var(--bg-secondary, rgba(0,0,0,0.03))',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: 'var(--border)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              padding: 4,
              flexShrink: 0,
            }}
          >
            Scan at reception
          </div>
          <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
            <p><strong>GSTIN:</strong> 29AABCU9603R1ZX</p>
            <p className="listing-muted">Place of supply: Karnataka · SAC: 9963 (Accommodation services)</p>
            <p className="listing-muted">Payment received in full. This is a computer-generated invoice.</p>
          </div>
        </div>

        {/* Terms & conditions */}
        <section
          style={{
            marginBottom: '1.25rem',
            padding: '1rem',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: '0.78rem',
            lineHeight: 1.65,
            color: 'var(--text-secondary)',
          }}
        >
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Terms &amp; Conditions
          </h3>

          <p style={{ marginBottom: '0.65rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Cancellation policy ({cancellationPolicy}):</strong>{' '}
            {getCancellationSummary(cancellationPolicy)}
          </p>
          <ul style={{ margin: '0 0 0.75rem 1.1rem', padding: 0 }}>
            {cancellationRules.map((rule) => (
              <li key={rule} style={{ marginBottom: '0.25rem' }}>{rule}</li>
            ))}
          </ul>

          <p style={{ marginBottom: '0.5rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>House rules:</strong> Check-in after {formatTime12(checkInTime)}; checkout before {formatTime12(checkOutTime)}.
            {room?.policies?.pet_allowed ? ' Pets allowed.' : ' No pets allowed.'}
            {room?.policies?.smoking_allowed ? ' Smoking permitted in designated areas.' : ' Non-smoking property.'}
            {' '}Guests must present a valid government ID at check-in.
          </p>

          <p style={{ marginBottom: '0.5rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Payment:</strong> All charges include applicable GST and platform service fees as shown above.
            Refunds, if eligible under the cancellation policy, are processed to the original payment method within 5–7 business days.
          </p>

          <p style={{ marginBottom: 0 }}>
            By completing this booking you agreed to StayEase&apos;s{' '}
            <Link to="/terms" className="receipt-print-hide">Terms of Service</Link>
            <span className="receipt-print-only">Terms of Service (stayease.com/terms)</span>,{' '}
            <Link to="/privacy-policy" className="receipt-print-hide">Privacy Policy</Link>
            <span className="receipt-print-only">Privacy Policy</span>, and cancellation terms.
            For disputes or support, contact support@stayease.com quoting booking ID {booking._id}.
          </p>
        </section>

        <footer
          className="listing-muted"
          style={{ textAlign: 'center', fontSize: '0.85rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}
        >
          Thank you for choosing StayEase — we hope you enjoy your stay!
        </footer>
      </div>

      <div className="receipt-print-hide" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      <style>{`
        .receipt-print-only { display: none; }
        @media print {
          .navbar, .footer, .mobile-bottom-nav, .receipt-print-hide { display: none !important; }
          .receipt-print-only { display: inline !important; }
          .receipt-page { padding: 0; }
          .receipt-print-area {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            padding: 1.5rem !important;
          }
          body { background: white !important; color: #111 !important; }
          .receipt-print-area * { color: #111 !important; }
          .logo__img { max-height: 48px; }
        }
      `}</style>
    </div>
  );
}
