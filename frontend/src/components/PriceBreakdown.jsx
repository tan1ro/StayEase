import { formatCurrency } from '../api/api';
import GSTBreakdown from './GSTBreakdown';

export default function PriceBreakdown({ pricing, compact = false }) {
  if (!pricing) return null;

  const allItems = pricing.price_breakdown || [];
  const items = allItems.filter((item) => item.type !== 'fee');
  const guestFee =
    pricing.guest_platform_fee ??
    allItems.find((item) => item.type === 'fee')?.amount ??
    0;
  const grandTotal = pricing.total_price ?? pricing.gst_breakdown?.grand_total;

  return (
    <div className={`price-breakdown ${compact ? 'price-breakdown--compact' : ''}`} data-testid="price-breakdown">
      {items.map((item, i) => (
        <div
          key={i}
          className={`price-breakdown__row price-breakdown__row--${item.type}${item.multiRoom ? ' price-breakdown__row--multi-room-base' : ''}`}
        >
          <span>{item.label}</span>
          <span className={item.amount < 0 ? 'price-breakdown__discount' : ''}>
            {item.amount < 0 ? '-' : ''}
            {formatCurrency(Math.abs(item.amount))}
          </span>
        </div>
      ))}
      <div className="price-breakdown__row price-breakdown__row--subtotal">
        <span>Subtotal</span>
        <span>{formatCurrency(pricing.subtotal)}</span>
      </div>
      {(pricing.cgst_amount != null || pricing.gst_breakdown) && (
        <GSTBreakdown
          pricePerNight={pricing.final_price_per_night}
          nights={pricing.total_nights}
          gstBreakdown={pricing.gst_breakdown}
          cgstAmount={pricing.cgst_amount}
          sgstAmount={pricing.sgst_amount}
          gstAmount={pricing.gst_amount}
          gstRate={pricing.gst_rate}
        />
      )}
      {guestFee > 0 && (
        <div className="price-breakdown__row price-breakdown__row--fee" data-testid="guest-platform-fee">
          <span>StayEase service fee</span>
          <span>{formatCurrency(guestFee)}</span>
        </div>
      )}
      <div className="price-breakdown__row price-breakdown__row--total">
        <strong>Grand total</strong>
        <strong data-testid="grand-total">{formatCurrency(grandTotal)}</strong>
      </div>
    </div>
  );
}
