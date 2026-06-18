export const HOTEL_GST_SLABS = [
  {
    id: 'upto-7500',
    tariffLabel: 'Up to ₹7,500',
    rate: 0.05,
    rateLabel: '5%',
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
  if (price <= 0) return 0;
  return price > 7500 ? 0.18 : 0.05;
}

export function getHotelGstSlabForPrice(pricePerNight) {
  const price = Number(pricePerNight) || 0;
  return price > 7500 ? HOTEL_GST_SLABS[1] : HOTEL_GST_SLABS[0];
}

export function hotelGstSlabSummary(pricePerNight) {
  const slab = getHotelGstSlabForPrice(pricePerNight);
  const itcNote = slab.itcAllowed ? 'ITC allowed' : 'ITC not allowed';
  return `${slab.rateLabel} — ${slab.tariffLabel.toLowerCase()} · ${itcNote}`;
}
