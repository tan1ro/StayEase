import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Download, Star, X } from 'lucide-react';
import SafeImage from './SafeImage';
import StatusBadge from './StatusBadge';
import PriceBreakdown from './PriceBreakdown';
import { formatCurrency } from '../api/api';
import { formatBookedOnDate, formatBookedOnTime, formatRangeLabel } from '../utils/dates';
import {
  bookingToPricing,
  formatTransactionSummary,
  formatTripStaySummary,
  getTripTitle,
} from '../utils/tripBooking';
import { formatPaymentStatusLabel, getStatusBadgeVariant } from '../utils/statusBadge';
import { getPrimaryRoomImage } from '../utils/roomImages';
import Badge from './Badge';

function SortHeader({ label, column, sortBy, onSort }) {
  const descKey = `${column}_desc`;
  const ascKey = `${column}_asc`;
  const active = sortBy === descKey || sortBy === ascKey;
  const desc = sortBy === descKey;

  return (
    <button
      type="button"
      className={`trips-table__sort${active ? ' trips-table__sort--active' : ''}`}
      onClick={() => onSort(active && desc ? ascKey : descKey)}
    >
      {label}
      {active && (desc ? <ChevronDown size={14} aria-hidden /> : <ChevronUp size={14} aria-hidden />)}
    </button>
  );
}

function TripActions({ booking, bookingId, onReview, onCancel }) {
  return (
    <div className="trips-table__actions">
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

export default function TripsTable({
  bookings,
  roomMap,
  sortBy,
  onSort,
  onReview,
  onCancel,
}) {
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const toggleExpanded = (bookingId) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(bookingId)) next.delete(bookingId);
      else next.add(bookingId);
      return next;
    });
  };

  return (
    <div className="table-wrap trips-table-wrap">
      <table className="data-table trips-table">
        <thead>
          <tr>
            <th>Room</th>
            <th>
              <SortHeader label="Stay" column="stay" sortBy={sortBy} onSort={onSort} />
            </th>
            <th>
              <SortHeader label="Date booked" column="booked" sortBy={sortBy} onSort={onSort} />
            </th>
            <th>Transaction</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const bookingId = booking._id || booking.id;
            const room = roomMap[booking.room_id];
            const title = getTripTitle(booking, room);
            const image = getPrimaryRoomImage(room || { _id: booking.room_id, photos: [] });
            const pricing = bookingToPricing(booking);
            const expanded = expandedIds.has(bookingId);
            const gst = booking.gst_amount ?? 0;

            return (
              <Fragment key={bookingId}>
                <tr className={expanded ? 'trips-table__row--expanded' : undefined}>
                  <td className="trips-table__room" data-label="Room">
                    <Link to={`/rooms/${booking.room_id}`} className="trips-table__room-link">
                      <span className="trips-table__room-thumb">
                        <SafeImage src={image} alt={title} className="trips-table__room-image" fallbackSeed={booking.room_id} />
                      </span>
                      <span className="trips-table__room-copy">
                        <span className="trips-table__room-title">{title}</span>
                        {room?.room_number && (
                          <span className="trips-table__room-number">Room {room.room_number}</span>
                        )}
                      </span>
                    </Link>
                  </td>
                  <td className="trips-table__dates" data-label="Stay">
                    <span className="trips-table__stay-range">
                      {formatRangeLabel(booking.check_in_date, booking.check_out_date)}
                    </span>
                    <span className="trips-table__stay-meta">{formatTripStaySummary(booking)}</span>
                  </td>
                  <td className="trips-table__booked" data-label="Date booked">
                    <time dateTime={booking.created_at}>{formatBookedOnDate(booking.created_at)}</time>
                    <span className="trips-table__booked-time">{formatBookedOnTime(booking.created_at)}</span>
                  </td>
                  <td className="trips-table__total" data-label="Transaction">
                    <button
                      type="button"
                      className="trips-table__txn-toggle"
                      onClick={() => toggleExpanded(bookingId)}
                      aria-expanded={expanded}
                    >
                      <span className="trips-table__txn-amount">{formatCurrency(booking.total_price ?? 0)}</span>
                      <span className="trips-table__txn-meta">
                        {gst > 0 ? `incl. ${formatCurrency(gst)} GST` : formatTransactionSummary(booking)}
                      </span>
                      {expanded ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
                    </button>
                  </td>
                  <td className="trips-table__status" data-label="Status">
                    <StatusBadge status={booking.status} />
                    {booking.payment_status && booking.payment_status !== 'paid' && (
                      <Badge variant={getStatusBadgeVariant(booking.payment_status)}>
                        {formatPaymentStatusLabel(booking.payment_status)}
                      </Badge>
                    )}
                    {booking.status === 'cancelled' && booking.refund_amount != null && (
                      <span className="booking-refund-note">
                        Refund: {formatCurrency(booking.refund_amount)}
                      </span>
                    )}
                  </td>
                  <td className="trips-table__actions-cell" data-label="Actions">
                    <TripActions
                      booking={booking}
                      bookingId={bookingId}
                      onReview={onReview}
                      onCancel={onCancel}
                    />
                  </td>
                </tr>
                {expanded && pricing && (
                  <tr className="trips-table__detail-row">
                    <td colSpan={6} data-label="Transaction details">
                      <div className="trips-table__detail-panel">
                        <p className="trips-table__detail-title">Transaction details</p>
                        <PriceBreakdown pricing={pricing} compact />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
