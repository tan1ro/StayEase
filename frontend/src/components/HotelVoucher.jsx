import { BedDouble, BadgeCheck, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../api/api';
import CheckInVerificationCard from './CheckInVerificationCard';
import { Icon, ICON } from './ui/Icon';

const CANCELLATION_BULLETS = {
  flexible: [
    'Full refund if cancelled at least 24 hours before check-in.',
    '50% charge if cancelled within 24 hours of check-in.',
    'Any add-on charges are non-refundable.',
  ],
  moderate: [
    'Full refund if cancelled 5 or more days before check-in.',
    '50% refund if cancelled between 24 hours and 5 days before check-in.',
    'No refund if cancelled within 24 hours of check-in.',
    'Any add-on charges are non-refundable.',
  ],
  strict: [
    '50% refund if cancelled 7 or more days before check-in.',
    'No refund if cancelled within 7 days of check-in.',
    'Any add-on charges are non-refundable.',
  ],
};

function formatVoucherDate(iso) {
  if (!iso) return '—';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatBookingTimestamp(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function rs(amount) {
  return formatCurrency(amount ?? 0);
}

function DetailRow({ label, value, strong = false }) {
  return (
    <div className="hotel-voucher__detail-row">
      <span className="hotel-voucher__detail-label">{label}</span>
      <span className={`hotel-voucher__detail-value${strong ? ' hotel-voucher__detail-value--strong' : ''}`}>{value}</span>
    </div>
  );
}

export default function HotelVoucher({ booking, room, invoice, hostPhone }) {
  if (!booking || !room) return null;

  const location = room.location || {};
  const address = [location.address, location.area, location.city].filter(Boolean).join(', ');
  const policy = booking.cancellation_policy || room.policies?.cancellation || 'moderate';
  const cancelBullets = CANCELLATION_BULLETS[policy] || CANCELLATION_BULLETS.moderate;
  const amenities = (room.amenities || []).slice(0, 4);
  const inclusions = [
    'Accommodation only',
    amenities.length ? amenities.join(', ') : null,
    room.food_preference === 'veg' ? 'Vegetarian meals available' : null,
  ].filter(Boolean);

  const discount = booking.discount_amount || 0;
  const guestFee = booking.guest_platform_fee || 0;
  const invoiceNumber = invoice?.invoice_number || `SE-${String(booking._id).slice(-8).toUpperCase()}`;

  return (
    <article className="hotel-voucher" id="hotel-voucher-print">
      <header className="hotel-voucher__header">
        <img src="/stayease_logo.svg" alt="StayEase" className="hotel-voucher__logo" />
        <div className="hotel-voucher__title-block">
          <Icon icon={BedDouble} size={ICON.lg} />
          <h1>Hotel Confirmation Voucher</h1>
        </div>
      </header>

      <div className="hotel-voucher__guest-bar">
        <strong>Guest Name:</strong> {booking.guest_name}
        {booking.booker_name && booking.booker_name !== booking.guest_name && (
          <span className="hotel-voucher__booker"> (Booked by {booking.booker_name})</span>
        )}
      </div>

      <hr className="hotel-voucher__rule" />

      <section className="hotel-voucher__hotel-block">
        <div className="hotel-voucher__hotel-main">
          <h2 className="hotel-voucher__hotel-name">{room.title}</h2>
          <p className="hotel-voucher__certified">
            <Icon icon={BadgeCheck} size={ICON.sm} />
            StayEase Verified Property
          </p>
          <p className="hotel-voucher__address">{address}</p>
          {hostPhone && <p className="hotel-voucher__phone">Phone: {hostPhone}</p>}
        </div>
        <div className="hotel-voucher__dates">
          <div className="hotel-voucher__date-box">
            <span>Check IN</span>
            <strong>{formatVoucherDate(booking.check_in_date)}</strong>
            <small>{room.policies?.check_in_time || '12:00 PM'}</small>
          </div>
          <div className="hotel-voucher__date-box">
            <span>Check OUT</span>
            <strong>{formatVoucherDate(booking.check_out_date)}</strong>
            <small>{room.policies?.check_out_time || '11:00 AM'}</small>
          </div>
        </div>
      </section>

      <hr className="hotel-voucher__rule" />

      <section className="hotel-voucher__grid">
        <div className="hotel-voucher__col">
          <DetailRow label="Booking ID (StayEase)" value={booking._id} />
          <DetailRow label="Hotel Booking ID" value={`${room.room_number}-${String(booking._id).slice(-6)}`} />
          <DetailRow label="Voucher / Invoice No." value={invoiceNumber} />
          <DetailRow label="Date of Booking" value={formatBookingTimestamp(booking.created_at)} />
          <DetailRow label="Room Type" value={`${room.room_category} — ${room.title}`} />
          <DetailRow
            label="Occupancy"
            value={`${booking.num_guests} Guest${booking.num_guests !== 1 ? 's' : ''}`}
          />
        </div>
        <div className="hotel-voucher__col hotel-voucher__col--amounts">
          <DetailRow label="Room Charges" value={rs(booking.subtotal)} />
          <DetailRow label="GST (Tax)" value={rs(booking.gst_amount)} />
          {guestFee > 0 && <DetailRow label="StayEase Service Fee" value={rs(guestFee)} />}
          {discount > 0 && (
            <DetailRow
              label={booking.offer_code ? `Discount (${booking.offer_code})` : 'Discount'}
              value={`-${rs(discount)}`}
            />
          )}
          <DetailRow label="Net Amount Paid" value={rs(booking.total_price)} strong />
        </div>
      </section>

      <div className="hotel-voucher__inclusions">
        <strong>Inclusions:</strong> {inclusions.join(' | ')}
      </div>

      <p className="hotel-voucher__important">
        <strong>Important Note:</strong> Booked &amp; Payable at StayEase. Present this voucher at hotel check-in.
      </p>
      <p className="hotel-voucher__service-desc">
        <strong>Description of Service:</strong> Reservation services for accommodation.
      </p>

      <div className="hotel-voucher__congrats">
        <strong>Thank you for booking with StayEase.</strong>
        <p>
          This property is listed on StayEase with verified host details and GST-compliant billing.
          Keep this voucher and valid photo ID ready for a smooth check-in.
        </p>
      </div>

      <CheckInVerificationCard booking={booking} showBooker />

      <section className="hotel-voucher__policy-box">
        <h3>Cancellation Policy</h3>
        <ul>
          {cancelBullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="hotel-voucher__policy-box hotel-voucher__policy-box--wide">
        <h3>Hotel Policy</h3>
        <ul>
          <li>Standard check-in time is {room.policies?.check_in_time || '12:00 PM'} and check-out is {room.policies?.check_out_time || '11:00 AM'}.</li>
          <li>All guests above 18 years must carry a valid government-issued photo ID (Aadhar, PAN, Passport, or Driving Licence).</li>
          <li>The ID or photograph submitted during booking must match the guest presenting at check-in.</li>
          <li>Early check-in and late check-out are subject to availability and may attract additional charges.</li>
          <li>Room tariff is exclusive of personal expenses, laundry, telephone, and in-room dining unless stated.</li>
          <li>GST as applicable is included in the amount paid through StayEase.</li>
          <li>The hotel reserves the right of admission in accordance with local laws.</li>
        </ul>
      </section>

      <section className="hotel-voucher__policy-box">
        <h3>Cancellation Procedures</h3>
        <ul>
          <li>Log in to StayEase → My Trips → select booking → Cancel reservation.</li>
          <li>Refunds are processed as per the cancellation policy above within 5–7 business days.</li>
          <li>For assistance, contact StayEase support before your check-in date.</li>
        </ul>
      </section>

      <section className="hotel-voucher__policy-box hotel-voucher__policy-box--accent">
        <h3>Modifications &amp; Refunds</h3>
        <ul>
          <li>StayEase acts as an intermediary between you and the host for this reservation.</li>
          <li>Date changes and guest count updates are subject to availability and price difference.</li>
          <li>Refunds, when applicable, are credited to the original payment method.</li>
          <li>See <Link to="/terms#cancellation">Terms of Service</Link> for full details.</li>
        </ul>
      </section>

      <div className="hotel-voucher__support">
        <p>
          <Icon icon={Headphones} size={ICON.sm} />
          <strong>StayEase Support</strong> — Write to us for faster resolution.
        </p>
        <p>
          Visit <Link to="/bookings">My Trips</Link> or email support via your registered account.
        </p>
      </div>

      <footer className="hotel-voucher__footer">
        <p>Total has been rounded off to the nearest rupee value.</p>
        <p><strong>StayEase — Smart Hotel Management</strong></p>
        <p>GST Identification No: displayed on tax invoice where applicable</p>
        <p>HSN/SAC: 998552 (Reservation services for accommodation)</p>
        <p className="hotel-voucher__disclaimer">
          <strong>Disclaimer:</strong> Hotel accommodation charges and applicable GST are collected on behalf of the
          property. StayEase service fees relate to platform reservation services.
        </p>
        <p className="hotel-voucher__generated">(This is a computer generated document. Does not require any signature.)</p>
      </footer>
    </article>
  );
}
