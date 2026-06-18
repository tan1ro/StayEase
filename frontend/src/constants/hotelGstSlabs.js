export const HOTEL_GST_SLABS = [
  {
    id: 'budget',
    tariffLabel: 'Below ₹1,000',
    rate: 0,
    rateLabel: '0%',
    itcLabel: 'Not Applicable',
    itcAllowed: false,
  },
  {
    id: 'standard',
    tariffLabel: '₹1,001 to ₹7,500',
    rate: 0.05,
    rateLabel: '5%',
    itcLabel: 'Not Allowed',
    itcAllowed: false,
  },
  {
    id: 'premium',
    tariffLabel: 'Above ₹7,500',
    rate: 0.18,
    rateLabel: '18%',
    itcLabel: 'Allowed',
    itcAllowed: true,
  },
];

export const LONG_TERM_RENTAL_GST = {
  id: 'long-term',
  tariffLabel: 'Up to ₹20,000/month per person (min. 90-day stay)',
  rate: 0,
  rateLabel: '0%',
  itcLabel: 'Not Applicable',
  itcAllowed: false,
  minNights: 90,
  monthlyCapPerPerson: 20000,
  categories: ['Dormitory'],
};

export function getHotelGstRate(pricePerNight, options = {}) {
  const price = Number(pricePerNight) || 0;
  const { nights = 0, roomCategory = null } = options;

  if (
    nights >= LONG_TERM_RENTAL_GST.minNights
    && LONG_TERM_RENTAL_GST.categories.includes(roomCategory)
    && price * 30 <= LONG_TERM_RENTAL_GST.monthlyCapPerPerson
  ) {
    return 0;
  }

  if (price < 1000) return 0;
  if (price <= 7500) return 0.05;
  return 0.18;
}

export function getHotelGstSlabForPrice(pricePerNight, options = {}) {
  const price = Number(pricePerNight) || 0;
  const { nights = 0, roomCategory = null } = options;

  if (
    nights >= LONG_TERM_RENTAL_GST.minNights
    && LONG_TERM_RENTAL_GST.categories.includes(roomCategory)
    && price * 30 <= LONG_TERM_RENTAL_GST.monthlyCapPerPerson
  ) {
    return LONG_TERM_RENTAL_GST;
  }

  if (price < 1000) return HOTEL_GST_SLABS[0];
  if (price <= 7500) return HOTEL_GST_SLABS[1];
  return HOTEL_GST_SLABS[2];
}

export function hotelGstSlabSummary(pricePerNight, options = {}) {
  const slab = getHotelGstSlabForPrice(pricePerNight, options);
  const itcNote = slab.itcAllowed ? 'ITC allowed' : 'ITC not allowed';
  return `${slab.rateLabel} — ${slab.tariffLabel.toLowerCase()} · ${itcNote}`;
}
