import ConfirmModal from './ConfirmModal';

export default function LogoutConfirmModal({ open, onClose, onConfirm }) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Log out"
      message="Are you sure you want to log out?"
      confirmLabel="Log out"
      cancelLabel="Cancel"
      confirmClassName="btn btn-primary"
      centered
    />
  );
}
