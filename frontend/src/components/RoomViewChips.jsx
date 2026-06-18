import { Eye, Sunrise, Sunset } from 'lucide-react';
import { formatViewType, getSunlightTraits } from '../constants/roomPlacement';
import { Icon, ICON } from './ui/Icon';

/**
 * Uniform view / sunlight / category chips for room cards, booking, and floor picker.
 */
export default function RoomViewChips({
  room,
  size = 'sm',
  showCategory = false,
  showRoomNumber = false,
  className = '',
}) {
  if (!room) return null;

  const view = formatViewType(room.view_type);
  const { sunrise, sunset } = getSunlightTraits(room.facing_side);
  const hasContent = view || sunrise || sunset || (showCategory && room.room_category)
    || (showRoomNumber && room.room_number);

  if (!hasContent) return null;

  const chipClass = `room-view-chips__chip room-view-chips__chip--${size}`;

  return (
    <div className={`room-view-chips room-view-chips--${size} ${className}`.trim()} data-testid="room-view-chips">
      {showRoomNumber && room.room_number && (
        <span className={`${chipClass} room-view-chips__chip--room`}>
          Room {room.room_number}
        </span>
      )}
      {showCategory && room.room_category && (
        <span className={`${chipClass} room-view-chips__chip--category`}>
          {room.room_category}
        </span>
      )}
      {view && (
        <span className={`${chipClass} room-view-chips__chip--view`}>
          <Icon icon={Eye} size={size === 'md' ? ICON.sm : 12} />
          {view}
        </span>
      )}
      {sunrise && (
        <span className={`${chipClass} room-view-chips__chip--sunrise`} title="Sunrise side">
          <Icon icon={Sunrise} size={size === 'md' ? ICON.sm : 12} />
          Sunrise
        </span>
      )}
      {sunset && (
        <span className={`${chipClass} room-view-chips__chip--sunset`} title="Sunset side">
          <Icon icon={Sunset} size={size === 'md' ? ICON.sm : 12} />
          Sunset
        </span>
      )}
    </div>
  );
}
