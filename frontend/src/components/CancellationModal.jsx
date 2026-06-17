import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';
import { bookingsApi, formatCurrency } from '../api/api';

export default function CancellationModal({ open, onClose, bookingId, onCancelled }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!open || !bookingId) return;
    setLoading(true);
    setError('');
    setAccepted(false);
    bookingsApi
      .cancellationPreview(bookingId)
      .then(({ data }) => setPreview(data))
      .catch((err) => setError(err.normalized?.message || 'Could not load cancellation details'))
      .finally(() => setLoading(false));
  }, [open, bookingId]);

  const handleConfirm = async () => {
    if (!accepted) return;
    setSubmitting(true);
    setError('');
    try {
      await bookingsApi.cancel(bookingId);
      onCancelled?.();
      onClose();
    } catch (err) {
      setError(err.normalized?.message || 'Cancellation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Cancel booking">
      {loading && <Spinner label="Calculating refund..." />}
      <ErrorMessage message={error} />
      {preview && !loading && (
        <div className="cancel-modal">
          <p className="cancel-modal__policy">
            <strong>{preview.cancellation_policy?.charAt(0).toUpperCase() + preview.cancellation_policy?.slice(1)}</strong> policy
          </p>
          <p className="cancel-modal__reason">{preview.reason}</p>
          <div className="cancel-modal__breakdown">
            <div className="cancel-modal__row">
              <span>Original total</span>
              <span>{formatCurrency(preview.total_price)}</span>
            </div>
            <div className="cancel-modal__row cancel-modal__row--charge">
              <span>Cancellation charge</span>
              <span>- {formatCurrency(preview.cancellation_charge)}</span>
            </div>
            <div className="cancel-modal__row cancel-modal__row--refund">
              <span>Refund amount</span>
              <strong>{formatCurrency(preview.refund_amount)}</strong>
            </div>
          </div>
          {preview.cancellation_charge > 0 && (
            <p className="cancel-modal__warning">
              <AlertTriangle size={16} />
              A cancellation fee of {formatCurrency(preview.cancellation_charge)} will be deducted per the listing policy.
            </p>
          )}
          <label className="cancel-modal__accept">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            I understand the cancellation charges and agree to the{' '}
            <Link to="/terms#cancellation" target="_blank" rel="noreferrer">Terms & Cancellation Policy</Link>.
          </label>
          <div className="cancel-modal__actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Keep booking
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={!accepted || submitting}
              onClick={handleConfirm}
            >
              {submitting ? 'Cancelling...' : 'Confirm cancellation'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
