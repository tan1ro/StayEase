import { Info } from 'lucide-react';
import { getHotelGstSlabForPrice } from '../../constants/hotelGstSlabs';
import { Icon, ICON } from '../ui/Icon';

export default function HotelGstInfoAlert({ pricePerNight }) {
  const slab = getHotelGstSlabForPrice(pricePerNight);

  return (
    <div className="listing-wizard__gst-alert" role="note">
      <Icon icon={Info} size={ICON.md} />
      <p>
        Indian hotel GST applies at 5% for room tariffs up to ₹7,500/night (ITC not allowed)
        and 18% above ₹7,500/night (ITC allowed). Your weekday rate uses the{' '}
        <strong>{slab.rateLabel}</strong> slab — StayEase calculates CGST/SGST on every guest booking.
      </p>
    </div>
  );
}
