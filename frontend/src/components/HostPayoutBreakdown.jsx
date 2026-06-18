import { formatCurrency } from '../api/api';

export function hostPayout(booking) {
  if (booking?.host_payout != null) return booking.host_payout;
  return booking?.subtotal ?? booking?.total_price ?? 0;
}

export function hostPlatformFee(booking) {
  return booking?.host_platform_fee ?? 0;
}

export default function HostPayoutBreakdown({ booking, compact = false }) {
  if (!booking) return null;

  const subtotal = booking.subtotal ?? 0;
  const fee = hostPlatformFee(booking);
  const payout = hostPayout(booking);
  const guestPaid = booking.total_price ?? 0;

  return (
    <div className={`host-payout-breakdown ${compact ? 'host-payout-breakdown--compact' : ''}`} data-testid="host-payout-breakdown">
      <div className="host-payout-breakdown__row">
        <span>Room subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      {fee > 0 && (
        <div className="host-payout-breakdown__row host-payout-breakdown__row--fee">
          <span>StayEase host service fee</span>
          <span>-{formatCurrency(fee)}</span>
        </div>
      )}
      <div className="host-payout-breakdown__row host-payout-breakdown__row--total">
        <strong>Your earnings</strong>
        <strong data-testid="host-payout-total">{formatCurrency(payout)}</strong>
      </div>
      {!compact && guestPaid > 0 && (
        <p className="host-payout-breakdown__note">
          Guest paid {formatCurrency(guestPaid)} including GST and guest service fee
        </p>
      )}
    </div>
  );
}
