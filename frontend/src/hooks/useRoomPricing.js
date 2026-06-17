import { useEffect, useState } from 'react';
import { pricingApi } from '../api/api';
import { nightsBetween } from '../utils/listingParams';

export function useRoomPricing(roomId, checkIn, checkOut, offerCode) {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nights = nightsBetween(checkIn, checkOut);
  const normalizedOfferCode = offerCode?.trim() || undefined;

  useEffect(() => {
    if (!roomId || !nights) {
      setPricing(null);
      setError('');
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    pricingApi
      .calculate({
        room_id: roomId,
        check_in: checkIn,
        check_out: checkOut,
        offer_code: normalizedOfferCode,
      })
      .then(({ data }) => {
        if (!cancelled) setPricing(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setPricing(null);
          setError(err.normalized?.message || 'Could not load price');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, checkIn, checkOut, nights, normalizedOfferCode]);

  return { pricing, loading, error, nights: nights ?? 0 };
}
