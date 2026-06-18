import { useCallback, useMemo, useState } from 'react';
import { Eye, GripVertical, Image, Trash2, Upload } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const MAX_PHOTOS = 10;

export default function ImageUploader({
  photos = [],
  onUpload,
  onDelete,
  uploading,
  onReorder,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const canReorder = typeof onReorder === 'function' && photos.length > 1;
  const viewerPhoto = viewerIndex != null ? photos[viewerIndex] : null;

  const handleFiles = useCallback(
    (files) => {
      const list = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
      list.forEach((file) => onUpload?.(file));
    },
    [photos.length, onUpload],
  );

  const movePhoto = useCallback(
    (from, to) => {
      if (from == null || to == null || from === to) return;
      const next = [...photos];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      onReorder?.(next);
    },
    [photos, onReorder],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const dragHelp = useMemo(() => (canReorder ? 'Drag to reorder. Click to view.' : 'Click to view.'), [canReorder]);

  const handleConfirmDelete = async () => {
    if (!photoToDelete || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await onDelete?.(photoToDelete);
      setPhotoToDelete(null);
      if (viewerIndex != null) setViewerIndex(null);
    } catch (err) {
      setDeleteError(err?.message || 'Could not delete photo. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (deleting) return;
    setPhotoToDelete(null);
    setDeleteError('');
  };

  return (
    <div className="image-uploader">
      {photos.length < MAX_PHOTOS && (
        <label
          className={`image-uploader__drop ${dragOver ? 'image-uploader__drop--active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <Upload size={24} />
          <span>Drag & drop or click to upload (max {MAX_PHOTOS})</span>
          <span className="image-uploader__hint">{dragHelp}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}
      {uploading && <div className="image-uploader__progress">Uploading...</div>}
      <div className="image-uploader__grid">
        {photos.map((photo, idx) => (
          <div
            key={photo.public_id || photo.url}
            className={`image-uploader__item ${dragIndex === idx ? 'image-uploader__item--dragging' : ''}`}
            draggable={canReorder}
            onDragStart={() => setDragIndex(idx)}
            onDragOver={(e) => {
              if (!canReorder) return;
              e.preventDefault();
            }}
            onDrop={(e) => {
              if (!canReorder) return;
              e.preventDefault();
              movePhoto(dragIndex, idx);
              setDragIndex(null);
            }}
            onDragEnd={() => setDragIndex(null)}
          >
            {photo.url ? (
              <button
                type="button"
                className="image-uploader__img-btn"
                onClick={() => setViewerIndex(idx)}
                aria-label="View photo"
              >
                <img src={photo.url} alt="" />
              </button>
            ) : (
              <div className="image-uploader__placeholder"><Image size={24} /></div>
            )}
            <div className="image-uploader__actions">
              <button type="button" onClick={() => setViewerIndex(idx)} title="View">
                <Eye size={16} />
              </button>
              {canReorder && (
                <span className="image-uploader__drag-handle" title="Drag to reorder">
                  <GripVertical size={16} />
                </span>
              )}
              <button type="button" onClick={() => setPhotoToDelete(photo)} title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {viewerPhoto?.url && (
        <div className="image-uploader__viewer" role="dialog" aria-modal="true" onClick={() => setViewerIndex(null)}>
          <div className="image-uploader__viewer-inner" onClick={(e) => e.stopPropagation()}>
            <img src={viewerPhoto.url} alt="" />
            <div className="image-uploader__viewer-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setViewerIndex(null)}>Close</button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={viewerIndex <= 0}
                  onClick={() => setViewerIndex((i) => Math.max(0, i - 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={viewerIndex >= photos.length - 1}
                  onClick={() => setViewerIndex((i) => Math.min(photos.length - 1, i + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!photoToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete photo?"
        message="Are you sure you want to delete this photo? This cannot be undone."
        confirmLabel="Delete photo"
        confirming={deleting}
        error={deleteError}
      />
    </div>
  );
}
