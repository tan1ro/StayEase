import { Link } from 'react-router-dom';
import { Download, Star, X } from 'lucide-react';
import SafeImage from './SafeImage';
import StatusBadge from './StatusBadge';
import { formatCurrency } from '../api/api';
import { formatRangeLabel } from '../utils/dates';
import { getPrimaryRoomImage } from '../utils/roomImages';

function formatGuests(count) {
  if (count == null || Number.isNaN(Number(count))) return '—';
  const n = Number(count);
  return `${n} guest${n === 1 ? '' : 's'}`;
}

export default function TripBookingCard({
  booking,
  room,
  view = 'list',
  onReview,
  onCancel,
}) {
  const bookingId = booking._id || booking.id;
  const image = getPrimaryRoomImage(room || { _id: booking.room_id, photos: [] });
  const gst = booking.gst_amount ?? 0;
  const total = booking.total_price ?? 0;
  const title = booking.room_title || room?.title || `Room ${booking.room_id?.slice(-6)}`;

  const actions = (
    <>
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
    </>
  );

  if (view === 'list') {
    return (
      <article className="trip-card trip-card--list">
        <Link to={`/rooms/${booking.room_id}`} className="trip-card__thumb-link" aria-label={title}>
          <div className="trip-card__thumb">
            <SafeImage src={image} alt={title} className="trip-card__image" fallbackSeed={booking.room_id} />
          </div>
        </Link>

        <div className="trip-card__body">
          <strong className="trip-card__title">{title}</strong>
          <span>{formatRangeLabel(booking.check_in_date, booking.check_out_date)}</span>
          <span>
            {booking.total_nights ?? '—'} night{(booking.total_nights ?? 0) === 1 ? '' : 's'}
            {' · '}
            {formatGuests(booking.num_guests)}
          </span>
          <span>
            {formatCurrency(total)} total
            {gst > 0 ? ` (incl. ${formatCurrency(gst)} GST)` : ''}
          </span>
          <StatusBadge status={booking.status} />
          {booking.status === 'cancelled' && booking.refund_amount != null && (
            <span className="booking-refund-note">
              Refund: {formatCurrency(booking.refund_amount)}
            </span>
          )}
        </div>

        <div className="trip-card__actions">{actions}</div>
      </article>
    );
  }

  return (
    <article className={`trip-card trip-card--${view}`}>
      <Link to={`/rooms/${booking.room_id}`} className="trip-card__media" aria-label={title}>
        <SafeImage src={image} alt={title} className="trip-card__image" fallbackSeed={booking.room_id} />
      </Link>

      <div className="trip-card__body">
        <strong className="trip-card__title">{title}</strong>
        <span>{formatRangeLabel(booking.check_in_date, booking.check_out_date)}</span>
        <span>
          {booking.total_nights ?? '—'} night{(booking.total_nights ?? 0) === 1 ? '' : 's'}
          {' · '}
          {formatGuests(booking.num_guests)}
        </span>
        <span className="trip-card__price">
          {formatCurrency(total)}
          {gst > 0 ? ` · ${formatCurrency(gst)} GST` : ''}
        </span>
        <StatusBadge status={booking.status} />
        {booking.status === 'cancelled' && booking.refund_amount != null && (
          <span className="booking-refund-note">
            Refund: {formatCurrency(booking.refund_amount)}
          </span>
        )}
      </div>

      <div className="trip-card__actions">{actions}</div>
    </article>
  );
}
