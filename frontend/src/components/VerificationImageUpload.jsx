import { useRef, useState } from 'react';
import { Camera, Eye, Trash2, Upload } from 'lucide-react';
import Modal from './Modal';
import Spinner from './Spinner';
import { Icon, ICON } from './ui/Icon';

export default function VerificationImageUpload({
  id,
  label,
  hint,
  preview,
  accept = 'image/*',
  alt = 'Upload preview',
  validating = false,
  validatingLabel = 'Validating…',
  successMessage = '',
  error = '',
  onFileSelect,
  onRemove,
}) {
  const inputRef = useRef(null);
  const [viewOpen, setViewOpen] = useState(false);

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="form-group verification-upload">
      <span className="label" id={`${id}-label`}>{label}</span>
      {hint && <p className="form-hint verification-upload__hint">{hint}</p>}

      {!preview ? (
        <button
          type="button"
          className="booking-guest-verification__upload"
          onClick={openPicker}
          disabled={validating}
          aria-labelledby={`${id}-label`}
        >
          {validating ? <Spinner size={20} label="" /> : <Icon icon={Camera} size={ICON.md} />}
          <span className="booking-guest-verification__upload-text">
            {validating ? validatingLabel : 'Choose file'}
          </span>
        </button>
      ) : (
        <div className="verification-upload__preview-card">
          <img src={preview} alt={alt} className="verification-upload__preview-image" />
          <div className="verification-upload__actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setViewOpen(true)}>
              <Icon icon={Eye} size={ICON.sm} /> View
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={openPicker} disabled={validating}>
              <Icon icon={Upload} size={ICON.sm} /> {validating ? validatingLabel : 'Replace'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm verification-upload__delete" onClick={onRemove}>
              <Icon icon={Trash2} size={ICON.sm} /> Delete
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onFileSelect?.(file);
        }}
      />

      {successMessage && !error && <p className="verification-upload__success">{successMessage}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={label} size="lg">
        {preview && (
          <img src={preview} alt={alt} className="verification-upload__modal-image" />
        )}
      </Modal>
    </div>
  );
}
