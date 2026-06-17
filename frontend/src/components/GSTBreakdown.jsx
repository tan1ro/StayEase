import { formatCurrency } from '../api/api';

export function calculateGST(pricePerNight, nights) {
  const subtotal = pricePerNight * nights;
  let rate = 0;
  if (pricePerNight >= 1000 && pricePerNight <= 7500) rate = 0.12;
  else if (pricePerNight > 7500) rate = 0.18;

  const gst = subtotal * rate;
  const half = gst / 2;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    gst_rate: rate,
    cgst_rate: rate / 2,
    cgst_amount: Math.round(half * 100) / 100,
    sgst_rate: rate / 2,
    sgst_amount: Math.round(half * 100) / 100,
    total_gst: Math.round(gst * 100) / 100,
    grand_total: Math.round((subtotal + gst) * 100) / 100,
  };
}

export default function GSTBreakdown({
  pricePerNight,
  nights,
  gstBreakdown,
  cgstAmount,
  sgstAmount,
  gstAmount,
  gstRate,
}) {
  const gst =
    gstBreakdown ||
    (pricePerNight != null && nights != null ? calculateGST(pricePerNight, nights) : null);

  if (!gst && cgstAmount == null) return null;

  const cgst = cgstAmount ?? gst?.cgst_amount ?? 0;
  const sgst = sgstAmount ?? gst?.sgst_amount ?? 0;
  const totalGst = gstAmount ?? gst?.total_gst ?? cgst + sgst;
  const rate = gstRate ?? gst?.gst_rate ?? 0;
  const cgstRate = (rate / 2) * 100;
  const sgstRate = (rate / 2) * 100;

  return (
    <div className="gst-breakdown" data-testid="gst-breakdown">
      <div className="gst-breakdown__row">
        <span>CGST ({cgstRate}%)</span>
        <span data-testid="cgst-amount">{formatCurrency(cgst)}</span>
      </div>
      <div className="gst-breakdown__row">
        <span>SGST ({sgstRate}%)</span>
        <span data-testid="sgst-amount">{formatCurrency(sgst)}</span>
      </div>
      <div className="gst-breakdown__row">
        <span>Total GST ({(rate * 100).toFixed(0)}%)</span>
        <span data-testid="total-gst">{formatCurrency(totalGst)}</span>
      </div>
      <style>{`
        .gst-breakdown__row {
          display: flex;
          justify-content: space-between;
          padding: 0.25rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
