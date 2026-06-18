import { Link } from 'react-router-dom';
import { Download, Star, X } from 'lucide-react';
import SafeImage from './SafeImage';
import StatusBadge from './StatusBadge';
import PriceBreakdown from './PriceBreakdown';
import { formatCurrency } from '../api/api';
import { formatBookedOn, formatRangeLabel } from '../utils/dates';
import {
  bookingToPricing,
  formatTripStaySummary,
  getTripTitle,
} from '../utils/tripBooking';
import { formatPaymentStatusLabel, getStatusBadgeVariant } from '../utils/statusBadge';
import { getPrimaryRoomImage } from '../utils/roomImages';
import Badge from './Badge';

function TripActions({ booking, bookingId, onReview, onCancel, className = '' }) {
  return (
    <div className={`trip-card__actions ${className}`.trim()}>
      {booking.status === 'completed' && booking.can_review && (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onReview?.(booking)}>
          <Star size={14} /> Leave a Review
        </button>
      )}
      <Link to={`/receipt/${bookingId}`} className="btn btn-outline btn-sm">
        <Download size={14} /> Receipt &amp; Invoice
      </Link>
      {booking.status === 'confirmed' && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onCancel?.(bookingId)}>
          <X size={14} /> Cancel
        </button>
      )}
    </div>
  );
}

export default function TripBookingCard({
  booking,
  room,
  onReview,
  onCancel,
}) {
  const bookingId = booking._id || booking.id;
  const image = getPrimaryRoomImage(room || { _id: booking.room_id, photos: [] });
  const gst = booking.gst_amount ?? 0;
  const total = booking.total_price ?? 0;
  const title = getTripTitle(booking, room);
  const pricing = bookingToPricing(booking);

  return (
    <article className="trip-card trip-card--grid">
      <Link to={`/rooms/${booking.room_id}`} className="trip-card__media" aria-label={title}>
        <SafeImage src={image} alt={title} className="trip-card__image" fallbackSeed={booking.room_id} />
      </Link>

      <div className="trip-card__body">
        <div className="trip-card__head">
          <strong className="trip-card__title">{title}</strong>
          <StatusBadge status={booking.status} />
        </div>

        <dl className="trip-card__meta">
          <div className="trip-card__meta-item">
            <dt>Stay</dt>
            <dd>{formatRangeLabel(booking.check_in_date, booking.check_out_date)}</dd>
          </div>
          <div className="trip-card__meta-item">
            <dt>Booked on</dt>
            <dd>
              <time dateTime={booking.created_at}>{formatBookedOn(booking.created_at)}</time>
            </dd>
          </div>
          <div className="trip-card__meta-item">
            <dt>Guests</dt>
            <dd>{formatTripStaySummary(booking)}</dd>
          </div>
        </dl>

        <div className="trip-card__txn">
          <div className="trip-card__txn-summary">
            <span className="trip-card__price">{formatCurrency(total)}</span>
            {gst > 0 && (
              <span className="trip-card__txn-note">incl. {formatCurrency(gst)} GST</span>
            )}
          </div>
          {booking.payment_status && booking.payment_status !== 'paid' && (
            <Badge variant={getStatusBadgeVariant(booking.payment_status)}>
              {formatPaymentStatusLabel(booking.payment_status)}
            </Badge>
          )}
        </div>

        {pricing && (
          <div className="trip-card__breakdown">
            <p className="trip-card__breakdown-title">Transaction details</p>
            <PriceBreakdown pricing={pricing} compact />
          </div>
        )}

        {booking.status === 'cancelled' && booking.refund_amount != null && (
          <span className="booking-refund-note">
            Refund: {formatCurrency(booking.refund_amount)}
          </span>
        )}
      </div>

      <TripActions
        booking={booking}
        bookingId={bookingId}
        onReview={onReview}
        onCancel={onCancel}
        className="trip-card__actions--footer"
      />
    </article>
  );
}
