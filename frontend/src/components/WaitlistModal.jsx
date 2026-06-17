import { useState } from 'react';
import { Bell } from 'lucide-react';
import Modal from './Modal';
import { waitlistApi } from '../api/api';
import ErrorMessage from './ErrorMessage';
import Spinner from './Spinner';

export default function WaitlistModal({
  open,
  onClose,
  roomId,
  checkIn,
  checkOut,
  guestName,
  guestPhone,
}) {
  const [name, setName] = useState(guestName || '');
  const [phone, setPhone] = useState(guestPhone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await waitlistApi.join({
        room_id: roomId,
        guest_name: name,
        guest_phone: phone,
        check_in_date: checkIn,
        check_out_date: checkOut,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Join Waitlist" size="sm">
      {success ? (
        <div className="waitlist-success">
          <Bell size={32} color="var(--primary)" />
          <p>You&apos;re on the waitlist! We&apos;ll notify you when this room becomes available.</p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="waitlist-desc">
            This room is unavailable for your selected dates. Join the waitlist and we&apos;ll notify you via email and WhatsApp when it opens up.
          </p>
          <ErrorMessage message={error} />
          <div className="form-group">
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Phone (+91)</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              pattern="\d{10}"
              required
            />
          </div>
          {loading ? (
            <Spinner size={24} label="" />
          ) : (
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Join Waitlist
            </button>
          )}
        </form>
      )}
      <style>{`
        .waitlist-desc { color: var(--text-secondary); margin-bottom: 1rem; font-size: 0.9rem; }
        .waitlist-success { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
      `}</style>
    </Modal>
  );
}
