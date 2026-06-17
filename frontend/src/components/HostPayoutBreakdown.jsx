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
      <style>{`
        .host-payout-breakdown {
          border-top: 1px solid var(--border);
          padding-top: 0.75rem;
          margin-top: 0.75rem;
          font-size: 0.9rem;
        }
        .host-payout-breakdown--compact { font-size: 0.85rem; }
        .host-payout-breakdown__row {
          display: flex;
          justify-content: space-between;
          padding: 0.3rem 0;
          color: var(--text-secondary);
        }
        .host-payout-breakdown__row--fee span:last-child { color: var(--danger, #c13515); }
        .host-payout-breakdown__row--total {
          border-top: 1px solid var(--border);
          margin-top: 0.35rem;
          padding-top: 0.5rem;
          color: var(--text-primary);
        }
        .host-payout-breakdown__note {
          margin: 0.5rem 0 0;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
