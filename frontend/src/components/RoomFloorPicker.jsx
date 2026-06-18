import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Sunrise, Sunset, Waves, Mountain } from 'lucide-react';
import { formatCurrency, roomsApi } from '../api/api';
import {
  formatViewType,
  getSunlightTraits,
  groupRoomsByFloor,
} from '../constants/roomPlacement';
import { canToggleRoom, isRoomAvailableForDates, resolveAvailableSelection, toggleRoomSelection } from '../utils/adjacentRooms';
import RoomPlacementInfo from './RoomPlacementInfo';
import Spinner from './Spinner';

function viewIcon(viewType) {
  if (viewType === 'beach_view' || viewType === 'sea_view') return Waves;
  if (viewType === 'hill_view') return Mountain;
  return Eye;
}

function RoomTile({
  room,
  isSelected,
  canSelect,
  checkIn,
  checkOut,
  onToggleRoom,
  onSelectRoom,
  multiSelect,
}) {
  const { sunrise, sunset } = getSunlightTraits(room.facing_side);
  const view = formatViewType(room.view_type);
  const ViewIcon = viewIcon(room.view_type);
  const isBooked = !isRoomAvailableForDates(room);
  const query = new URLSearchParams({ check_in: checkIn, check_out: checkOut });

  const tileClass = [
    'room-floor-picker__tile',
    isBooked && 'room-floor-picker__tile--booked',
    !isBooked && isSelected && 'room-floor-picker__tile--selected',
    !isSelected && !isBooked && canSelect && 'room-floor-picker__tile--available',
    !isSelected && !isBooked && !canSelect && multiSelect && 'room-floor-picker__tile--blocked',
  ].filter(Boolean).join(' ');

  const content = (
    <>
      <span className="room-floor-picker__tile-number">{room.room_number}</span>
      <span className="room-floor-picker__tile-price">{formatCurrency(room.price_per_night)}/nt</span>
      {(sunrise || sunset) ? (
        <span className="room-floor-picker__tile-light">
          {sunrise && <Sunrise size={14} aria-hidden title="Sunrise side" />}
          {sunset && <Sunset size={14} aria-hidden title="Sunset side" />}
        </span>
      ) : (
        <span className="room-floor-picker__tile-light room-floor-picker__tile-light--empty" aria-hidden="true" />
      )}
      <span className="room-floor-picker__tile-view">
        {view ? (
          <>
            <ViewIcon size={12} aria-hidden />
            <span className="room-floor-picker__tile-view-text">{view}</span>
          </>
        ) : (
          <span className="room-floor-picker__tile-view-text room-floor-picker__tile-view-text--empty" aria-hidden="true">
            &nbsp;
          </span>
        )}
      </span>
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

  if (multiSelect) {
    return (
      <button
        type="button"
        className={tileClass}
        onClick={() => onToggleRoom?.(room)}
        disabled={!isSelected && !canSelect}
        aria-pressed={isSelected}
        title={
          isSelected
            ? `Room ${room.room_number} — selected`
            : canSelect
              ? `Add room ${room.room_number}`
              : `Room ${room.room_number} — select rooms next to each other on the same floor`
        }
      >
        {content}
      </button>
    );
  }

  if (isSelected) {
    return (
      <div className={tileClass} aria-current="true" title={`Room ${room.room_number} — selected`}>
        {content}
      </div>
    );
  }

  if (onSelectRoom) {
    return (
      <button
        type="button"
        className={tileClass}
        onClick={() => onSelectRoom(room._id)}
        title={`Select room ${room.room_number} — ${view || 'standard view'}`}
      >
        {content}
      </button>
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
  onSelectRoom,
  selectedRoomIds = [],
  onChangeSelectedRoomIds,
  multiSelect = Boolean(onChangeSelectedRoomIds),
  onPropertyRoomsChange,
}) {
  const [propertyRooms, setPropertyRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState('');

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
    if (!propertyRooms.length) return [];
    return propertyRooms;
  }, [propertyRooms]);

  const activeSelectedIds = selectedRoomIds.length ? selectedRoomIds : (roomId ? [roomId] : []);

  useEffect(() => {
    if (!propertyRooms.length || !onChangeSelectedRoomIds) return;
    const currentIds = selectedRoomIds.length ? selectedRoomIds : (roomId ? [roomId] : []);
    const { ids, notice } = resolveAvailableSelection(currentIds, propertyRooms, roomId);
    if (ids.join(',') !== currentIds.join(',')) {
      onChangeSelectedRoomIds(ids);
    }
    setSelectionNotice(notice);
  }, [propertyRooms, checkIn, checkOut, roomId, onChangeSelectedRoomIds]);

  useEffect(() => {
    onPropertyRoomsChange?.(allRooms);
  }, [allRooms, onPropertyRoomsChange]);

  const selectedRoom = useMemo(
    () => allRooms.find((r) => activeSelectedIds.includes(r._id))
      || allRooms.find((r) => r._id === roomId)
      || currentRoom,
    [allRooms, activeSelectedIds, roomId, currentRoom],
  );

  const selectedRooms = useMemo(
    () => allRooms.filter((room) => activeSelectedIds.includes(room._id)),
    [allRooms, activeSelectedIds],
  );

  const floorGroups = useMemo(() => groupRoomsByFloor(allRooms), [allRooms]);
  const maxRoomsPerFloor = useMemo(
    () => Math.max(1, ...floorGroups.map(({ rooms }) => rooms.length)),
    [floorGroups],
  );
  const hasMultipleRooms = allRooms.length > 1;
  const openRoomCount = useMemo(
    () => allRooms.filter(isRoomAvailableForDates).length,
    [allRooms],
  );

  const handleToggleRoom = (room) => {
    if (!multiSelect || !onChangeSelectedRoomIds) return;
    if (!isRoomAvailableForDates(room)) {
      setSelectionNotice(`Room ${room.room_number} is already booked for these dates. Pick an open room.`);
      return;
    }
    const next = toggleRoomSelection(room, activeSelectedIds, allRooms);
    if (next.join(',') === activeSelectedIds.join(',')) {
      setSelectionNotice('Choose rooms next to each other on the same floor.');
      return;
    }
    setSelectionNotice('');
    onChangeSelectedRoomIds(next);
  };

  if (!checkIn || !checkOut) {
    return (
      <p className="room-floor-picker__hint">
        Select check-in and check-out dates above to see room options.
      </p>
    );
  }

  if (loading) return <Spinner label="Loading rooms…" />;

  if (!propertyRooms.length) {
    return (
      <p className="room-floor-picker__hint">
        No rooms are available for these dates at this property. Try different dates or join the waitlist below.
      </p>
    );
  }

  if (openRoomCount === 0) {
    return (
      <p className="room-floor-picker__hint">
        All rooms are booked for these dates. Try different dates or join the waitlist below.
      </p>
    );
  }

  if (!selectedRoom) return null;

  if (!hasMultipleRooms) {
    const onlyRoom = allRooms[0];
    if (!isRoomAvailableForDates(onlyRoom)) {
      return (
        <p className="room-floor-picker__hint">
          This room is booked for your dates. Try different dates or join the waitlist below.
        </p>
      );
    }
    return (
      <section className="room-floor-picker room-floor-picker--single" aria-label="Your room">
        <RoomPlacementInfo room={onlyRoom} title="Your room" />
      </section>
    );
  }

  return (
    <section className="room-floor-picker" aria-label="Property room map">
      <div className="room-floor-picker__header">
        <h3>Choose your room{multiSelect ? 's' : ''}</h3>
        <p className="room-floor-picker__lead">
          {multiSelect
            ? 'Select one or more adjoining rooms on the same floor — ideal for families and group stays.'
            : 'Pick a room like selecting seats — compare floor, view, and sunrise or sunset light.'}
        </p>
        {multiSelect && activeSelectedIds.length > 0 && (
          <p className="room-floor-picker__selection-count">
            {activeSelectedIds.length} room{activeSelectedIds.length !== 1 ? 's' : ''} selected
            {selectedRooms.length > 1
              ? ` · Rooms ${selectedRooms.map((room) => room.room_number).join(', ')}`
              : selectedRoom?.room_number
                ? ` · Room ${selectedRoom.room_number}`
                : ''}
          </p>
        )}
        {selectionNotice && (
          <p className="room-floor-picker__notice" role="status">{selectionNotice}</p>
        )}
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

      <div className="room-floor-picker__map-scroll">
        <div
          className="room-floor-picker__map"
          style={{ '--tile-columns': maxRoomsPerFloor }}
        >
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
                    isSelected={activeSelectedIds.includes(room._id)}
                    canSelect={canToggleRoom(room, activeSelectedIds, allRooms)}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onToggleRoom={handleToggleRoom}
                    onSelectRoom={onSelectRoom}
                    multiSelect={multiSelect}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
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
        {multiSelect && (
          <li>
            <span className="room-floor-picker__legend-swatch room-floor-picker__legend-swatch--blocked" />
            Not adjacent
          </li>
        )}
        <li>
          <Sunrise size={14} aria-hidden />
          Sunrise side
        </li>
        <li>
          <Sunset size={14} aria-hidden />
          Sunset side
        </li>
      </ul>

      <RoomPlacementInfo
        room={selectedRoom}
        compact
        title={
          selectedRooms.length > 1
            ? `Selected rooms (${selectedRooms.map((item) => item.room_number).join(', ')})`
            : 'Selected room details'
        }
      />
    </section>
  );
}
