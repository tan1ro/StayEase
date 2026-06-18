export const HOTEL_GST_SLABS = [
  {
    id: 'below-1000',
    tariffLabel: 'Below ₹1,000',
    rate: 0,
    rateLabel: '0%',
    itcLabel: 'Not Applicable',
    itcAllowed: false,
  },
  {
    id: '1000-to-7500',
    tariffLabel: '₹1,000 – ₹7,500',
    rate: 0.12,
    rateLabel: '12%',
    itcLabel: 'Not Allowed',
    itcAllowed: false,
  },
  {
    id: 'above-7500',
    tariffLabel: 'Above ₹7,500',
    rate: 0.18,
    rateLabel: '18%',
    itcLabel: 'Allowed',
    itcAllowed: true,
  },
];

export function getHotelGstRate(pricePerNight) {
  const price = Number(pricePerNight) || 0;
  if (price < 1000) return 0;
  if (price <= 7500) return 0.12;
  return 0.18;
}

export function getHotelGstSlabForPrice(pricePerNight) {
  const price = Number(pricePerNight) || 0;
  if (price < 1000) return HOTEL_GST_SLABS[0];
  if (price <= 7500) return HOTEL_GST_SLABS[1];
  return HOTEL_GST_SLABS[2];
}

export function hotelGstSlabSummary(pricePerNight) {
  const slab = getHotelGstSlabForPrice(pricePerNight);
  const itcNote = slab.itcAllowed ? 'ITC allowed' : 'ITC not allowed';
  return `${slab.rateLabel} — ${slab.tariffLabel.toLowerCase()} · ${itcNote}`;
}
