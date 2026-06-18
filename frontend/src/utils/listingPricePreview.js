import { calculateGST } from '../components/GSTBreakdown';

const GUEST_PLATFORM_FEE_PERCENT = 10;
const HOST_PLATFORM_FEE_PERCENT = 3;

export function listingPricePreview(basePrice) {
  const subtotal = Math.max(0, Number(basePrice) || 0);
  const guestPlatformFee = Math.round(subtotal * GUEST_PLATFORM_FEE_PERCENT / 100);
  const hostPlatformFee = Math.round(subtotal * HOST_PLATFORM_FEE_PERCENT / 100);
  const guestPriceBeforeTaxes = subtotal + guestPlatformFee;
  const hostEarns = Math.round(subtotal - hostPlatformFee);
  const gst = calculateGST(subtotal, 1);

  return {
    subtotal,
    guestPlatformFee,
    hostPlatformFee,
    guestPriceBeforeTaxes,
    hostEarns,
    gst,
    guestPlatformFeePercent: GUEST_PLATFORM_FEE_PERCENT,
    hostPlatformFeePercent: HOST_PLATFORM_FEE_PERCENT,
    guestPaysInclGst: Math.round((gst.grand_total + guestPlatformFee) * 100) / 100,
  };
}

export function guestPaysPerNightInclGst(basePrice) {
  return listingPricePreview(basePrice).guestPaysInclGst;
}
