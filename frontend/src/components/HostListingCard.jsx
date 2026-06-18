import { Link } from 'react-router-dom';
import { ArrowUpRight, Star } from 'lucide-react';
import SafeImage from './SafeImage';
import { formatCurrency } from '../api/api';
import { Icon, ICON } from './ui/Icon';
import { getPrimaryRoomImage } from '../utils/roomImages';

export default function HostListingCard({ room }) {
  const photo = getPrimaryRoomImage(room);
  const title = room.title || `${room.room_category} in ${room.location?.area || room.location?.city}`;
  const category = room.room_category || 'Room';
  const rating = room.avg_rating || 0;
  const reviews = room.total_reviews || 0;

  return (
    <Link to={`/rooms/${room._id}`} className="host-listing-card">
      <div className="host-listing-card__media">
        <SafeImage
          src={photo}
          alt={title}
          className="host-listing-card__image"
          fallbackSeed={room._id}
        />
        <span className="host-listing-card__arrow" aria-hidden>
          <Icon icon={ArrowUpRight} size={ICON.sm} />
        </span>
      </div>
      <div className="host-listing-card__body">
        <span className="host-listing-card__category">{category}</span>
        <h3>{title}</h3>
        <div className="host-listing-card__footer">
          {rating > 0 ? (
            <p className="host-listing-card__rating">
              <Icon icon={Star} size={ICON.sm} fill="currentColor" />
              {rating.toFixed(2)}
              <span> · {reviews} review{reviews !== 1 ? 's' : ''}</span>
            </p>
          ) : (
            <span className="host-listing-card__price">
              from {formatCurrency(room.price_per_night)}/night
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
