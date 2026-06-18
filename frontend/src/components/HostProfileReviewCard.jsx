import StarRating from './StarRating';
import { formatRelativeTime } from '../utils/relativeTime';
import { getAvatarUrl } from '../utils/roomImages';

export default function HostProfileReviewCard({ review }) {
  const avatar = getAvatarUrl(review.guest_name, review.guest_id || review._id);
  const subtitle = review.room_title || review.room_city || 'StayEase guest';

  return (
    <article className="host-review-card">
      <span className="host-review-card__mark" aria-hidden>&ldquo;</span>
      <div className="host-review-card__header">
        <img src={avatar} alt="" className="host-review-card__avatar" />
        <div className="host-review-card__meta">
          <strong>{review.guest_name || 'Guest'}</strong>
          <span>{subtitle}</span>
        </div>
        <span className="host-review-card__score">{review.rating?.toFixed(1)}</span>
      </div>
      <div className="host-review-card__rating">
        <StarRating value={review.rating} readonly size={12} />
        <span>{formatRelativeTime(review.created_at)}</span>
      </div>
      {review.title && <strong className="host-review-card__title">{review.title}</strong>}
      <p className="host-review-card__body">{review.body}</p>
    </article>
  );
}
