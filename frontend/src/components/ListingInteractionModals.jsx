import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Modal from './Modal';
import ReviewCard from './ReviewCard';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';
import AmenityIcon from './AmenityIcon';
import { roomsApi } from '../api/api';
import { findAmenityCategory, sortAmenityCategories } from '../constants/amenities';
import { Icon, ICON } from './ui/Icon';

export function AllReviewsModal({ open, onClose, reviews, roomTitle, avgRating, onWriteReview }) {
  return (
    <Modal open={open} onClose={onClose} title={`Reviews · ${roomTitle}`} size="lg">
      {avgRating > 0 && (
        <p className="listing-modal__lead">
          Rated {avgRating.toFixed(2)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </p>
      )}
      <div className="listing-modal__reviews">
        {reviews.map((review) => (
          <ReviewCard key={review._id} review={review} />
        ))}
      </div>
      {onWriteReview && (
        <div className="listing-modal__actions">
          <button type="button" className="btn btn-primary" onClick={onWriteReview}>
            Write a review
          </button>
        </div>
      )}
    </Modal>
  );
}

export function NearbyAttractionsModal({ open, onClose, attractions, city }) {
  return (
    <Modal open={open} onClose={onClose} title={`Neighbourhood highlights · ${city}`} size="lg">
      <ul className="listing-modal__attractions">
        {attractions.map((item) => (
          <li key={item._id} className="listing-modal__attraction">
            <Icon icon={MapPin} size={ICON.sm} />
            <div>
              <strong>{item.name}</strong>
              <p>{item.description}</p>
              <span className="listing-muted">
                {item.distance_km} km away{item.open_hours ? ` · ${item.open_hours}` : ''}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export function MessageHostModal({ open, onClose, roomId, hostName, onSuccess }) {
  const [message, setMessage] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleClose = () => {
    setMessage('');
    setCheckIn('');
    setCheckOut('');
    setError('');
    setSent(false);
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }
    if (checkIn && checkOut && checkOut <= checkIn) {
      setError('Check-out must be after check-in');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await roomsApi.sendInquiry(roomId, {
        message: message.trim(),
        check_in: checkIn || undefined,
        check_out: checkOut || undefined,
      });
      setSent(true);
      onSuccess?.();
    } catch (err) {
      setError(err.normalized?.message || 'Could not send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={`Message ${hostName}`} size="md">
      {sent ? (
        <div className="listing-modal__success">
          <p>Your message was sent to {hostName}. They typically respond within an hour.</p>
          <div className="listing-modal__success-actions">
            <Link to="/messages" className="btn btn-primary" onClick={handleClose}>
              View your messages
            </Link>
            <button type="button" className="btn btn-ghost" onClick={handleClose}>Done</button>
          </div>
        </div>
      ) : (
        <form className="listing-modal__form" onSubmit={handleSubmit}>
          <p className="listing-modal__lead">
            Ask about availability, check-in, or anything else before you book.
          </p>
          <ErrorMessage message={error} />
          <div className="form-row">
            <div className="form-group">
              <label className="label" htmlFor="inquiry-check-in">Check-in (optional)</label>
              <input
                id="inquiry-check-in"
                type="date"
                className="input"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="inquiry-check-out">Check-out (optional)</label>
              <input
                id="inquiry-check-out"
                type="date"
                className="input"
                value={checkOut}
                min={checkIn || undefined}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="inquiry-message">Message</label>
            <textarea
              id="inquiry-message"
              className="textarea"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${hostName}, I'm interested in your listing…`}
              maxLength={1000}
              required
            />
            <span className="form-hint">{message.length}/1000</span>
          </div>
          {loading ? (
            <Spinner label="Sending…" />
          ) : (
            <button type="submit" className="btn btn-primary">Send message</button>
          )}
        </form>
      )}
    </Modal>
  );
}

const REPORT_REASONS = [
  { value: 'inaccurate', label: 'Listing is inaccurate or incorrect' },
  { value: 'scam', label: 'Suspected scam or fraud' },
  { value: 'offensive', label: 'Offensive or inappropriate content' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'other', label: 'Something else' },
];

export function ReportListingModal({ open, onClose, roomId, roomTitle, onSuccess }) {
  const [reason, setReason] = useState('inaccurate');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleClose = () => {
    setReason('inaccurate');
    setDetails('');
    setError('');
    setSent(false);
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (details.trim().length < 10) {
      setError('Please provide a few more details (at least 10 characters)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await roomsApi.report(roomId, { reason, details: details.trim() });
      setSent(true);
      onSuccess?.();
    } catch (err) {
      setError(err.normalized?.message || 'Could not submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Report this listing" size="md">
      {sent ? (
        <div className="listing-modal__success">
          <p>Thank you. Our trust &amp; safety team will review your report for {roomTitle}.</p>
          <button type="button" className="btn btn-primary" onClick={handleClose}>Close</button>
        </div>
      ) : (
        <form className="listing-modal__form" onSubmit={handleSubmit}>
          <p className="listing-modal__lead">
            Tell us what&apos;s wrong. Reports are confidential and help keep StayEase safe.
          </p>
          <ErrorMessage message={error} />
          <div className="form-group">
            <label className="label" htmlFor="report-reason">Reason</label>
            <select
              id="report-reason"
              className="select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {REPORT_REASONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="report-details">Details</label>
            <textarea
              id="report-details"
              className="textarea"
              rows={5}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the issue with this listing…"
              maxLength={2000}
              required
            />
          </div>
          {loading ? (
            <Spinner label="Submitting…" />
          ) : (
            <button type="submit" className="btn btn-primary">Submit report</button>
          )}
        </form>
      )}
    </Modal>
  );
}

export function AmenitiesModal({ open, onClose, amenities }) {
  const grouped = amenities.reduce((acc, name) => {
    const category = findAmenityCategory(name);
    if (!acc[category]) acc[category] = [];
    acc[category].push(name);
    return acc;
  }, {});

  const sections = sortAmenityCategories(Object.entries(grouped));

  return (
    <Modal open={open} onClose={onClose} title="What this place offers" size="lg">
      <div className="amenities-modal">
        {sections.map(([category, items]) => (
          <section key={category} className="amenities-modal__section">
            <h4>{category}</h4>
            <ul className="amenities-modal__list">
              {items.map((name) => (
                <li key={name}>
                  <AmenityIcon name={name} showLabel />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
