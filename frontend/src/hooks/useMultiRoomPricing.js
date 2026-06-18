import { useEffect, useMemo, useState } from 'react';
import { pricingApi } from '../api/api';
import { nightsBetween } from '../utils/listingParams';

function sumPricing(items) {
  if (!items.length) return null;
  const totalNights = items[0]?.total_nights || 0;
  const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const gstAmount = items.reduce((sum, item) => sum + (item.gst_amount || 0), 0);
  const guestPlatformFee = items.reduce((sum, item) => sum + (item.guest_platform_fee || 0), 0);
  const discountAmount = items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);

  return {
    ...items[0],
    subtotal,
    total_price: totalPrice,
    gst_amount: gstAmount,
    guest_platform_fee: guestPlatformFee,
    discount_amount: discountAmount,
    total_nights: totalNights,
    room_breakdown: items,
    gst_breakdown: items[0]?.gst_breakdown ? {
      cgst_amount: gstAmount / 2,
      sgst_amount: gstAmount / 2,
      cgst_rate: (items[0]?.gst_rate || 0) / 2,
      sgst_rate: (items[0]?.gst_rate || 0) / 2,
    } : undefined,
  };
}

export function useMultiRoomPricing(roomIds, checkIn, checkOut, offerCode) {
  const [roomPricing, setRoomPricing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nights = nightsBetween(checkIn, checkOut);
  const normalizedOfferCode = offerCode?.trim() || undefined;
  const roomKey = [...roomIds].sort().join(',');

  useEffect(() => {
    if (!roomIds.length || !nights) {
      setRoomPricing([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all(
      roomIds.map((roomId, index) => pricingApi.calculate({
        room_id: roomId,
        check_in: checkIn,
        check_out: checkOut,
        offer_code: index === 0 ? normalizedOfferCode : undefined,
      }).then(({ data }) => data)),
    )
      .then((items) => {
        if (!cancelled) setRoomPricing(items);
      })
      .catch((err) => {
        if (!cancelled) {
          setRoomPricing([]);
          setError(err.normalized?.message || 'Could not load price');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomKey, checkIn, checkOut, nights, normalizedOfferCode]);

  const pricing = useMemo(() => sumPricing(roomPricing), [roomPricing]);

  return { pricing, roomPricing, loading, error, nights: nights ?? 0 };
}
