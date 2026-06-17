import { Link } from 'react-router-dom';
import { Building2, MoreHorizontal } from 'lucide-react';
import { formatCurrency } from '../../api/api';
import { isValidRoomId } from '../../utils/roomId';
import { Icon, ICON } from '../ui/Icon';

function listingStatus(room) {
  if (room.is_available) return { label: 'Live', variant: 'live' };
  const incomplete = !room.photos?.length || (room.description?.length || 0) < 50;
  if (incomplete) return { label: 'Action required', variant: 'action' };
  return { label: 'Ready to publish', variant: 'draft' };
}

export default function HostListingCard({ room, onAction }) {
  const status = listingStatus(room);
  const photo = room.photos?.find((p) => p.is_primary) || room.photos?.[0];
  const location = [room.location?.area, room.location?.city].filter(Boolean).join(', ');
  const editorPath = isValidRoomId(room._id) ? `/host/rooms/${room._id}/editor` : '/host/rooms/add';

  return (
    <article className="host-listing-card">
      <Link to={editorPath} className="host-listing-card__media">
        {photo?.url ? (
          <img src={photo.url} alt="" />
        ) : (
          <div className="host-listing-card__placeholder">
            <Icon icon={Building2} size={ICON.xl} />
          </div>
        )}
        {status.variant === 'action' && (
          <span className="host-listing-card__badge host-listing-card__badge--action">Required to publish</span>
        )}
      </Link>
      <div className="host-listing-card__body">
        <div className="host-listing-card__top">
          <div>
            <h3>{room.title || 'Untitled listing'}</h3>
            <p>{room.room_category} in {location || 'India'}</p>
          </div>
          <button type="button" className="host-listing-card__more" onClick={() => onAction?.(room)} aria-label="Listing options">
            <Icon icon={MoreHorizontal} size={ICON.md} />
          </button>
        </div>
        <div className="host-listing-card__meta">
          <span className={`host-listing-card__status host-listing-card__status--${status.variant}`}>
            {status.label}
          </span>
          <span>{formatCurrency(room.price_per_night)}/night</span>
        </div>
      </div>
    </article>
  );
}

export function isListingIncomplete(room) {
  return !room.is_available && (
    !room.photos?.length
    || (room.description?.length || 0) < 50
    || (room.title?.length || 0) < 5
  );
}
