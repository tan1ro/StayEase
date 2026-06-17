import { Star } from 'lucide-react';

export default function StarRating({
  value = 0,
  onChange,
  readonly = false,
  size = 18,
  showValue = false,
}) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`star-rating ${readonly ? 'star-rating--readonly' : ''}`} role="group" aria-label="Rating">
      {stars.map((star) => {
        const filled = value >= star;
        const half = !filled && value >= star - 0.5;
        return (
          <button
            key={star}
            type="button"
            className={`star-rating__star ${filled ? 'star-rating__star--filled' : ''} ${half ? 'star-rating__star--half' : ''}`}
            onClick={() => !readonly && onChange?.(star)}
            disabled={readonly}
            aria-label={`${star} stars`}
            data-testid={`star-${star}`}
          >
            <Star size={size} fill={filled || half ? 'currentColor' : 'none'} />
          </button>
        );
      })}
      {showValue && <span className="star-rating__value">{value.toFixed(1)}</span>}
      <style>{`
        .star-rating {
          display: inline-flex;
          align-items: center;
          gap: 0.15rem;
        }
        .star-rating__star {
          background: none;
          border: none;
          padding: 0;
          color: var(--text-muted);
          cursor: pointer;
        }
        .star-rating--readonly .star-rating__star {
          cursor: default;
        }
        .star-rating__star--filled,
        .star-rating__star--half {
          color: var(--warning);
        }
        .star-rating__value {
          margin-left: 0.35rem;
          font-size: 0.9rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
