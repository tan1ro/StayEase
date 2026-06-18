import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, roomsApi } from '../api/api';
import { buildRoomPlacementSummary } from '../constants/roomPlacement';
import Spinner from './Spinner';
import RoomBadges from './RoomBadges';

export default function RoomAlternativesPicker({
  roomId,
  currentRoomId,
  checkIn,
  checkOut,
}) {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId || !checkIn || !checkOut) {
      setAlternatives([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    roomsApi
      .alternatives(roomId, { check_in: checkIn, check_out: checkOut })
      .then(({ data }) => {
        if (!cancelled) setAlternatives(data || []);
      })
      .catch(() => {
        if (!cancelled) setAlternatives([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [roomId, checkIn, checkOut]);

  if (!checkIn || !checkOut) return null;
  if (loading) return <Spinner label="Checking other rooms…" />;
  if (!alternatives.length) return null;

  const query = new URLSearchParams({ check_in: checkIn, check_out: checkOut });

  return (
    <section className="room-alternatives card">
      <h3>Other rooms at this property</h3>
      <p className="room-alternatives__lead">
        Prefer a different room number or view? These rooms are also available for your dates.
      </p>
      <ul className="room-alternatives__list">
        {alternatives.map((room) => {
          const placement = buildRoomPlacementSummary(room);
          const isCurrent = room._id === currentRoomId;
          return (
            <li key={room._id} className={`room-alternatives__item${isCurrent ? ' room-alternatives__item--current' : ''}`}>
              <div className="room-alternatives__main">
                <strong>Room {room.room_number}</strong>
                <span className="room-alternatives__title">{room.title}</span>
                <div className="room-alternatives__meta">
                  {placement.map(({ label, value }) => (
                    <span key={label}>{label}: {value}</span>
                  ))}
                </div>
                <RoomBadges
                  food_preference={room.food_preference}
                  smoking_policy={room.smoking_policy}
                  alcohol_policy={room.alcohol_policy}
                  view_type={room.view_type}
                  has_balcony={room.has_balcony}
                  compact
                />
              </div>
              <div className="room-alternatives__aside">
                <strong>{formatCurrency(room.price_per_night)}</strong>
                <span>/ night</span>
                {isCurrent ? (
                  <span className="room-alternatives__current">Selected</span>
                ) : (
                  <Link
                    to={`/book/${room._id}?${query.toString()}`}
                    className="btn btn-outline btn-sm"
                  >
                    Switch to this room
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
