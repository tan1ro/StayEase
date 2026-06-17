import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import Modal from '../Modal';
import { Icon, ICON } from '../ui/Icon';

export default function PublishSuccessModal({ open, onClose, roomId, title }) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="host-publish-modal host-publish-modal--success">
        <div className="host-publish-modal__icon host-publish-modal__icon--success" aria-hidden="true">
          <Icon icon={CheckCircle2} size={40} />
        </div>
        <h2 className="host-publish-modal__title">Your listing is live!</h2>
        <p className="host-publish-modal__text">
          <strong>{title || 'Your room'}</strong> is now on StayEase. Guests can book with GST-inclusive pricing and you&apos;ll get WhatsApp alerts.
        </p>
        <div className="host-publish-modal__actions">
          {roomId && (
            <Link to={`/rooms/${roomId}`} className="btn btn-outline" onClick={onClose}>
              <Icon icon={ExternalLink} size={ICON.sm} />
              View listing
            </Link>
          )}
          <Link to="/host/rooms" className="btn btn-primary" onClick={onClose}>
            Go to listings
          </Link>
        </div>
      </div>
    </Modal>
  );
}
