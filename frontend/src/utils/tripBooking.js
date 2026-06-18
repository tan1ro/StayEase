import { formatCurrency } from '../api/api';
import { formatBookedOn, formatRangeLabel } from './dates';

export function bookingToPricing(booking) {
  if (!booking) return null;
  const gstAmount = booking.gst_amount ?? 0;
  return {
    price_breakdown: booking.price_breakdown,
    subtotal: booking.subtotal,
    total_nights: booking.total_nights,
    final_price_per_night: booking.final_price_per_night,
    gst_rate: booking.gst_rate,
    gst_amount: gstAmount,
    guest_platform_fee: booking.guest_platform_fee,
    total_price: booking.total_price,
    gst_breakdown: gstAmount
      ? {
          cgst_amount: gstAmount / 2,
          sgst_amount: gstAmount / 2,
          cgst_rate: (booking.gst_rate || 0) / 2,
          sgst_rate: (booking.gst_rate || 0) / 2,
        }
      : undefined,
  };
}

export function formatTripGuests(count) {
  if (count == null || Number.isNaN(Number(count))) return '—';
  const n = Number(count);
  return `${n} guest${n === 1 ? '' : 's'}`;
}

export function formatTripStaySummary(booking) {
  const nights = booking.total_nights ?? '—';
  const nightLabel = (booking.total_nights ?? 0) === 1 ? 'night' : 'nights';
  return `${nights} ${nightLabel} · ${formatTripGuests(booking.num_guests)}`;
}

export function formatTransactionSummary(booking) {
  const total = booking.total_price ?? 0;
  const gst = booking.gst_amount ?? 0;
  const fee = booking.guest_platform_fee ?? 0;
  const parts = [formatCurrency(total)];
  if (gst > 0) parts.push(`${formatCurrency(gst)} GST`);
  if (fee > 0) parts.push(`${formatCurrency(fee)} fee`);
  return parts.join(' · ');
}

export function getTripTitle(booking, room) {
  return booking.room_title || room?.title || `Room ${booking.room_id?.slice(-6)}`;
}

export function sortTrips(bookings, sortBy) {
  const list = [...bookings];
  list.sort((a, b) => {
    if (sortBy === 'booked_asc' || sortBy === 'booked_desc') {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return sortBy === 'booked_desc' ? bTime - aTime : aTime - bTime;
    }
    if (sortBy === 'stay_asc' || sortBy === 'stay_desc') {
      const cmp = String(a.check_in_date || '').localeCompare(String(b.check_in_date || ''));
      return sortBy === 'stay_desc' ? -cmp : cmp;
    }
    return 0;
  });
  return list;
}

export function tripSearchHaystack(booking, room) {
  return [
    booking.guest_name,
    booking.room_title,
    room?.room_number,
    room?.title,
    formatRangeLabel(booking.check_in_date, booking.check_out_date),
    formatBookedOn(booking.created_at),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
