import StarRating from './StarRating';

export default function ReviewCard({ review, compact = false }) {
  const initials = (review.guest_name || 'G').charAt(0).toUpperCase();
  const dateStr = review.created_at
    ? new Date(review.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  if (compact) {
    return (
      <div className="review-card-compact">
        <div className="review-card-compact__header">
          <div className="review-card-compact__avatar">{initials}</div>
          <div>
            <strong>{review.guest_name}</strong>
            <span className="review-card-compact__date">{dateStr}</span>
          </div>
        </div>
        <StarRating value={review.rating} readonly size={12} />
        {review.room_number && (
          <span className="review-card-compact__room">Room {review.room_number}</span>
        )}
        {review.title && <strong className="review-card-compact__title">{review.title}</strong>}
        <p className="review-card-compact__body">{review.body}</p>
      </div>
    );
  }

  return (
    <div className="review-card card">
      <div className="review-card__header">
        <strong>{review.guest_name}</strong>
        <StarRating value={review.rating} readonly size={14} />
      </div>
      {review.title && <h4>{review.title}</h4>}
      {review.room_number && (
        <p className="review-card__room">Room {review.room_number}</p>
      )}
      <p>{review.body}</p>
      {review.host_response && (
        <div className="review-card__response">
          <strong>Host response:</strong>
          <p>{review.host_response}</p>
        </div>
      )}
      <time className="review-card__date">{dateStr}</time>
    </div>
  );
}
