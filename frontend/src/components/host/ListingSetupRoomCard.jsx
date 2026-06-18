import { MapPin } from 'lucide-react';
import { Icon, ICON } from '../ui/Icon';

export default function ListingSetupRoomCard({ room, loading }) {
  if (loading) {
    return <div className="host-setup-room-card host-setup-room-card--loading">Loading listing…</div>;
  }

  if (!room) {
    return (
      <div className="host-setup-room-card host-setup-room-card--empty">
        <p>Your new StayEase listing</p>
      </div>
    );
  }

  const photo = room.photos?.find((p) => p.is_primary) || room.photos?.[0];
  const location = [room.location?.area, room.location?.city].filter(Boolean).join(', ');

  return (
    <div className="host-setup-room-card">
      <div className="host-setup-room-card__media">
        {photo?.url ? (
          <img src={photo.url} alt="" />
        ) : (
          <div className="host-setup-room-card__placeholder" />
        )}
      </div>
      <div className="host-setup-room-card__body">
        <h3>{room.title || 'Your listing'}</h3>
        {location && (
          <p>
            <Icon icon={MapPin} size={ICON.sm} />
            {location}
          </p>
        )}
      </div>
    </div>
  );
}
