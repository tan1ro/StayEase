import { Info } from 'lucide-react';
import { getHotelGstSlabForPrice } from '../../constants/hotelGstSlabs';
import { Icon, ICON } from '../ui/Icon';

export default function HotelGstInfoAlert({ pricePerNight }) {
  const slab = getHotelGstSlabForPrice(pricePerNight);

  return (
    <div className="listing-wizard__gst-alert" role="note">
      <Icon icon={Info} size={ICON.md} />
      <p>
        Indian hotel GST applies at 0% below ₹1,000/night, 5% for ₹1,001–₹7,500/night (ITC not allowed),
        and 18% above ₹7,500/night (ITC allowed). Dormitory stays of 90+ nights up to ₹20,000/month per person
        are exempt. Your weekday rate uses the <strong>{slab.rateLabel}</strong> slab — StayEase calculates
        CGST/SGST on every guest booking.
      </p>
    </div>
  );
}
