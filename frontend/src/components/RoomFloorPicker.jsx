import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Sunrise, Sunset, Waves, Mountain } from 'lucide-react';
import { formatCurrency, roomsApi } from '../api/api';
import {
  formatViewType,
  getSunlightTraits,
  groupRoomsByFloor,
} from '../constants/roomPlacement';
import RoomPlacementInfo from './RoomPlacementInfo';
import Spinner from './Spinner';

function RoomTile({ room, isSelected, checkIn, checkOut }) {
  const { sunrise, sunset } = getSunlightTraits(room.facing_side);
  const view = formatViewType(room.view_type);
  const isBooked = room.available_for_dates === false;
  const query = new URLSearchParams({ check_in: checkIn, check_out: checkOut });

  const tileClass = [
    'room-floor-picker__tile',
    isSelected && 'room-floor-picker__tile--selected',
    !isSelected && !isBooked && 'room-floor-picker__tile--available',
    isBooked && 'room-floor-picker__tile--booked',
  ].filter(Boolean).join(' ');

  const content = (
    <>
      <span className="room-floor-picker__tile-number">{room.room_number}</span>
      <span className="room-floor-picker__tile-price">{formatCurrency(room.price_per_night)}</span>
      {(sunrise || sunset) && (
        <span className="room-floor-picker__tile-light">
          {sunrise && <Sunrise size={14} aria-hidden />}
          {sunset && <Sunset size={14} aria-hidden />}
        </span>
      )}
      {view && <span className="room-floor-picker__tile-view">{view}</span>}
    </>
  );

  if (isBooked) {
    return (
      <div
        className={tileClass}
        aria-disabled="true"
        title={`Room ${room.room_number} — already booked for these dates`}
      >
        {content}
      </div>
    );
  }

  if (isSelected) {
    return (
      <div className={tileClass} aria-current="true" title={`Room ${room.room_number} — selected`}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to={`/book/${room._id}?${query.toString()}`}
      className={tileClass}
      title={`Switch to room ${room.room_number}`}
    >
      {content}
    </Link>
  );
}

export default function RoomFloorPicker({
  roomId,
  currentRoom,
  checkIn,
  checkOut,
}) {
  const [propertyRooms, setPropertyRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId || !checkIn || !checkOut) {
      setPropertyRooms([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    roomsApi
      .alternatives(roomId, { check_in: checkIn, check_out: checkOut })
      .then(({ data }) => {
        if (!cancelled) setPropertyRooms(data || []);
      })
      .catch(() => {
        if (!cancelled) setPropertyRooms([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [roomId, checkIn, checkOut]);

  const allRooms = useMemo(() => {
    if (!propertyRooms.length && currentRoom) {
      return [{ ...currentRoom, available_for_dates: true }];
    }
    return propertyRooms;
  }, [propertyRooms, currentRoom]);

  const selectedRoom = useMemo(
    () => allRooms.find((r) => r._id === roomId) || currentRoom,
    [allRooms, roomId, currentRoom],
  );

  const floorGroups = useMemo(() => groupRoomsByFloor(allRooms), [allRooms]);
  const hasMultipleRooms = allRooms.length > 1;

  if (!checkIn || !checkOut) {
    return (
      <p className="room-floor-picker__hint">
        Select check-in and check-out dates above to see room options.
      </p>
    );
  }

  if (loading) return <Spinner label="Loading rooms…" />;

  if (!selectedRoom) return null;

  if (!hasMultipleRooms) {
    return (
      <section className="room-floor-picker room-floor-picker--single" aria-label="Your room">
        <RoomPlacementInfo room={selectedRoom} title="Your room" />
      </section>
    );
  }

  return (
    <section className="room-floor-picker" aria-label="Property room map">
      <div className="room-floor-picker__header">
        <h3>Choose your room</h3>
        <p className="room-floor-picker__lead">
          Pick a room like selecting seats — compare floor, view, and sunrise or sunset light.
        </p>
      </div>

      <div className="room-floor-picker__compass" aria-hidden="true">
        <span className="room-floor-picker__compass-east">
          <Sunrise size={18} />
          Sunrise
        </span>
        <span className="room-floor-picker__compass-center">
          <Eye size={16} />
          View direction
        </span>
        <span className="room-floor-picker__compass-west">
          <Sunset size={18} />
          Sunset
        </span>
      </div>

      <div className="room-floor-picker__map">
        {floorGroups.map(({ floor, label, rooms }) => (
          <div key={floor} className="room-floor-picker__row">
            <div className="room-floor-picker__floor">
              <span className="room-floor-picker__floor-num">{floor <= 0 ? 'G' : floor}</span>
              <span className="room-floor-picker__floor-label">{label}</span>
            </div>
            <div className="room-floor-picker__tiles">
              {rooms.map((room) => (
                <RoomTile
                  key={room._id}
                  room={room}
                  isSelected={room._id === roomId}
                  checkIn={checkIn}
                  checkOut={checkOut}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <ul className="room-floor-picker__legend">
        <li>
          <span className="room-floor-picker__legend-swatch room-floor-picker__legend-swatch--selected" />
          Selected
        </li>
        <li>
          <span className="room-floor-picker__legend-swatch room-floor-picker__legend-swatch--available" />
          Open
        </li>
        <li>
          <span className="room-floor-picker__legend-swatch room-floor-picker__legend-swatch--booked" />
          Booked
        </li>
        <li>
          <Sunrise size={14} aria-hidden />
          Sunrise side
        </li>
        <li>
          <Sunset size={14} aria-hidden />
          Sunset side
        </li>
      </ul>
    </section>
  );
}
