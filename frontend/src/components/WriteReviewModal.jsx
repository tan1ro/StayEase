import { useState } from 'react';
import { Star } from 'lucide-react';
import Modal from './Modal';
import StarRating from './StarRating';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';
import { reviewsApi } from '../api/api';
import { Icon, ICON } from './ui/Icon';

export default function WriteReviewModal({
  open,
  onClose,
  booking,
  roomTitle,
  propertyName,
  onSubmitted,
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const hotelName = propertyName || roomTitle || booking?.room_title || 'this hotel';
  const roomLabel = booking?.room_number ? ` (Room ${booking.room_number})` : '';

  const handleClose = () => {
    if (loading) return;
    setRating(5);
    setTitle('');
    setBody('');
    setWouldRecommend(true);
    setError('');
    setSuccess(false);
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!booking?._id) return;
    if (rating < 1) {
      setError('Please select a star rating');
      return;
    }
    if (title.trim().length < 3) {
      setError('Add a short headline (at least 3 characters)');
      return;
    }
    if (body.trim().length < 10) {
      setError('Share a few details about your stay (at least 10 characters)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await reviewsApi.create({
        booking_id: booking._id,
        rating,
        title: title.trim(),
        body: body.trim(),
        would_recommend: wouldRecommend,
        photos: [],
      });
      setSuccess(true);
      onSubmitted?.();
      window.setTimeout(handleClose, 1200);
    } catch (err) {
      setError(err.normalized?.message || 'Could not submit your review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Rate this hotel" size="md">
      {success ? (
        <div className="write-review-success" role="status">
          <Icon icon={Star} size={ICON.lg} fill="currentColor" />
          <p>Thanks for reviewing {hotelName}{roomLabel}!</p>
        </div>
      ) : (
        <form className="write-review-form" onSubmit={handleSubmit}>
          <p className="listing-modal__lead">
            How was your stay at {hotelName}{roomLabel}? Your review helps other travellers choose the right hotel.
          </p>

          <div className="form-group">
            <span className="label">Overall rating</span>
            <StarRating value={rating} onChange={setRating} size={28} />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="review-title">Headline</label>
            <input
              id="review-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={120}
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="review-body">Your review</label>
            <textarea
              id="review-body"
              className="textarea"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What did you like? Was the stay clean, comfortable, and as described?"
              maxLength={2000}
              required
            />
          </div>

          <label className="write-review-form__recommend">
            <input
              type="checkbox"
              checked={wouldRecommend}
              onChange={(e) => setWouldRecommend(e.target.checked)}
            />
            I would recommend this stay to others
          </label>

          <ErrorMessage message={error} />
          {loading ? (
            <Spinner label="Submitting review…" />
          ) : (
            <button type="submit" className="btn btn-primary write-review-form__submit">
              Submit review
            </button>
          )}
        </form>
      )}
    </Modal>
  );
}
