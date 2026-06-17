import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import Modal from '../Modal';
import { isValidRoomId } from '../../utils/roomId';
import { Icon, ICON } from '../ui/Icon';

export default function PublishDetailsModal({ open, onClose, roomId }) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="host-publish-modal">
        <p className="host-publish-modal__eyebrow">Required to publish</p>
        <div className="host-publish-modal__icon" aria-hidden="true">
          <Icon icon={ShieldCheck} size={40} />
        </div>
        <h2 className="host-publish-modal__title">Confirm a few key details</h2>
        <p className="host-publish-modal__text">
          Finish your StayEase listing — add photos, title, description, and GST pricing before guests can book.
        </p>
        <Link
          to={isValidRoomId(roomId) ? `/host/rooms/${roomId}/editor` : '/host/rooms/add'}
          className="btn btn-primary host-publish-modal__cta"
          onClick={onClose}
        >
          Get started
        </Link>
      </div>
    </Modal>
  );
}
