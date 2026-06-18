import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { formatCurrency, roomId, wishlistApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import SafeImage from './SafeImage';
import { Icon, ICON } from './ui/Icon';
import { getPrimaryRoomImage } from '../utils/roomImages';

export default function RoomCard({
  room,
  matchScore,
  onWishlistToggle,
  nights = 2,
  compareMode = false,
  compareSelected = false,
  onCompareToggle,
}) {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { openAuthGate } = useOnboarding();
  const id = roomId(room);
  const [wishlisted, setWishlisted] = useState(user?.wishlist?.includes(id));
  const primaryPhoto = getPrimaryRoomImage(room);

  const isTouristFavourite = room.avg_rating >= 4.85 && room.total_reviews >= 10;
  const totalPrice = Math.round(room.price_per_night * nights);
  const displayTitle = room.title || `${room.room_category} in ${room.location?.area}`;

  const handleHeart = async (e) => {
    e.stopPropagation();
    if (!user) {
      openAuthGate({
        title: 'Log in to save this stay',
        message: 'Create an account or log in to save stays to your wishlist and plan your next trip.',
        cta: 'Log in',
      });
      return;
    }
    try {
      const { data } = await wishlistApi.toggle(id);
      setWishlisted(data.wishlisted ?? data.added);
      await refreshUser();
      onWishlistToggle?.(id);
    } catch {
      /* handled by interceptor */
    }
  };

  const handleClick = () => navigate(`/rooms/${id}`);

  return (
    <article
      className="room-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      data-testid="room-card"
    >
      <div className="room-card__image-wrap">
        <SafeImage
          src={primaryPhoto}
          alt={displayTitle}
          className="room-card__image"
          fallbackSeed={id}
        />
        <button
          type="button"
          className={`room-card__heart ${wishlisted ? 'room-card__heart--active' : ''}`}
          onClick={handleHeart}
          aria-label="Toggle wishlist"
        >
          <Icon icon={Heart} size={ICON.md} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        {isTouristFavourite && (
          <span className="room-card__favourite" data-testid="tourist-favourite">
            Tourist favourite
          </span>
        )}
        {matchScore != null && (
          <span className="room-card__match" data-testid="match-badge">
            {matchScore}% match
          </span>
        )}
        {!room.is_available && (
          <span className="room-card__unavailable" data-testid="unavailable-badge">
            Unavailable
          </span>
        )}
        {compareMode && (
          <label
            className="room-card__compare"
            style={{ position: 'absolute', top: 8, left: 8, background: 'var(--card-bg)', padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', zIndex: 2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={compareSelected}
              onChange={() => onCompareToggle?.(id)}
            />
            {' '}Compare
          </label>
        )}
      </div>
      <div className="room-card__body">
        <div className="room-card__row">
          <h3 className="room-card__title">{displayTitle}</h3>
          {room.avg_rating > 0 && (
            <span className="room-card__rating">
              <Icon icon={Star} size={ICON.sm} fill="currentColor" /> {room.avg_rating.toFixed(2)}
            </span>
          )}
        </div>
        <p className="room-card__meta">
          {room.location?.area}, {room.location?.city}
          {room.distance_km != null && (
            <span className="room-card__distance"> · {room.distance_km} km away</span>
          )}
        </p>
        <p className="room-card__price">
          <strong>{formatCurrency(totalPrice)}</strong>
          <span> for {nights} nights</span>
        </p>
      </div>
    </article>
  );
}
