import { useCallback, useEffect, useMemo, useState } from 'react';
import { pricingApi } from '../api/api';
import { nightsBetween } from '../utils/listingParams';
import { sumMultiRoomPricing } from '../utils/multiRoomPricing';

export function useMultiRoomPricing(roomIds, checkIn, checkOut, offerCode, rooms = []) {
  const [roomPricing, setRoomPricing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nights = nightsBetween(checkIn, checkOut);
  const normalizedOfferCode = offerCode?.trim() || undefined;
  const roomKey = [...roomIds].sort().join(',');

  const roomLabelById = useMemo(() => {
    const map = new Map();
    rooms.forEach((room) => {
      if (room?._id) {
        map.set(room._id, room.room_number || room.title || 'Room');
      }
    });
    return map;
  }, [rooms]);

  const getRoomLabel = useCallback(
    (_, index) => roomLabelById.get(roomIds[index]) || `Room ${index + 1}`,
    [roomIds, roomLabelById],
  );

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

  const pricing = useMemo(
    () => sumMultiRoomPricing(roomPricing, getRoomLabel),
    [roomPricing, getRoomLabel],
  );

  return { pricing, roomPricing, loading, error, nights: nights ?? 0 };
}
