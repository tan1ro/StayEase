import Modal from './Modal';

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirmClassName = 'btn btn-danger',
  confirming = false,
  error = '',
}) {
  return (
    <Modal open={open} onClose={confirming ? undefined : onClose} title={title} size="sm">
      <p className="confirm-modal__message">{message}</p>
      {error && <p className="confirm-modal__error" role="alert">{error}</p>}
      <div className="confirm-modal__actions">
        <button type="button" className="btn btn-outline" onClick={onClose} disabled={confirming}>
          {cancelLabel}
        </button>
        <button type="button" className={confirmClassName} onClick={onConfirm} disabled={confirming}>
          {confirming ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
