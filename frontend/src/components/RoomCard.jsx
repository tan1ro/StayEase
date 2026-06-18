import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { formatCurrency, roomId, wishlistApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import SafeImage from './SafeImage';
import { Icon, ICON } from './ui/Icon';
import { getPrimaryRoomImage } from '../utils/roomImages';
import RoomViewChips from './RoomViewChips';

export default function RoomCard({
  room,
  matchScore,
  onWishlistToggle,
  nights = 2,
  compareMode = false,
  compareSelected = false,
  onCompareToggle,
  tags = [],
}) {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { openAuthGate } = useOnboarding();
  const id = roomId(room);
  const [wishlisted, setWishlisted] = useState(user?.wishlist?.includes(id));
  const primaryPhoto = getPrimaryRoomImage(room);

  useEffect(() => {
    setWishlisted(user?.wishlist?.includes(id));
  }, [user?.wishlist, id]);

  const totalPrice = Math.round(room.price_per_night * nights);
  const displayTitle = room.title || `${room.room_category} in ${room.location?.area}`;
  const [propertyTitle, roomTypeTitle] = displayTitle.includes(' · ')
    ? displayTitle.split(' · ', 2)
    : [displayTitle, null];

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
    const next = !wishlisted;
    setWishlisted(next);
    try {
      const { data } = await wishlistApi.toggle(id);
      const saved = data.wishlisted ?? data.added ?? next;
      setWishlisted(saved);
      await refreshUser();
      onWishlistToggle?.(id, saved);
    } catch {
      setWishlisted(!next);
    }
  };

  const handleClick = () => navigate(`/rooms/${id}`);

  const handleCompareChange = (e) => {
    e.stopPropagation();
    onCompareToggle?.(id);
  };

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
        {compareMode && (
          <label
            className={`room-card__compare${compareSelected ? ' room-card__compare--active' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              className="room-card__compare-input"
              checked={compareSelected}
              onChange={handleCompareChange}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Compare ${displayTitle}`}
            />
            <span className="room-card__compare-label">Compare</span>
          </label>
        )}
        <button
          type="button"
          className={`room-card__heart ${wishlisted ? 'room-card__heart--active' : ''}`}
          onClick={handleHeart}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={wishlisted}
        >
          <Icon icon={Heart} size={ICON.md} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        {tags.length > 0 && (
          <div className="room-card__tags">
            {tags.map((tag) => (
              <span
                key={tag.key}
                className={`room-card__tag ${tag.className}`}
                data-testid={tag.testId}
              >
                {tag.label}
              </span>
            ))}
          </div>
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
      </div>
      <div className="room-card__body">
        <div className="room-card__row">
          <h3 className="room-card__title">
            <span className="room-card__title-main">{propertyTitle}</span>
            {roomTypeTitle && <span className="room-card__title-sub">{roomTypeTitle}</span>}
          </h3>
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
        <RoomViewChips room={room} showCategory />
        <p className="room-card__price">
          <strong>{formatCurrency(totalPrice)}</strong>
          <span> for {nights} nights</span>
        </p>
      </div>
    </article>
  );
}
