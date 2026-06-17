import { useCallback, useState } from 'react';
import { Image, Star, Trash2, Upload } from 'lucide-react';

const MAX_PHOTOS = 10;

export default function ImageUploader({ photos = [], onUpload, onDelete, onSetPrimary, uploading }) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files) => {
      const list = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
      list.forEach((file) => onUpload?.(file));
    },
    [photos.length, onUpload],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
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
        {photos.map((photo) => (
          <div key={photo.public_id || photo.url} className="image-uploader__item">
            {photo.url ? (
              <img src={photo.url} alt="" />
            ) : (
              <div className="image-uploader__placeholder"><Image size={24} /></div>
            )}
            <div className="image-uploader__actions">
              <button type="button" onClick={() => onSetPrimary?.(photo)} title="Set primary">
                <Star size={16} fill={photo.is_primary ? 'currentColor' : 'none'} />
              </button>
              <button type="button" onClick={() => onDelete?.(photo)} title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .image-uploader__drop {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 2rem;
          border: 2px dashed var(--border);
          border-radius: var(--radius-card);
          cursor: pointer;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        .image-uploader__drop--active { border-color: var(--primary); background: var(--primary-light); }
        .image-uploader__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.75rem;
        }
        .image-uploader__item {
          position: relative;
          aspect-ratio: 1;
          border-radius: var(--radius-input);
          overflow: hidden;
        }
        .image-uploader__item img { width: 100%; height: 100%; object-fit: cover; }
        .image-uploader__placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg);
        }
        .image-uploader__actions {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          display: flex;
          justify-content: space-around;
          padding: 0.35rem;
          background: rgba(0,0,0,0.6);
        }
        .image-uploader__actions button {
          background: none; border: none; color: #fff; cursor: pointer;
        }
        .image-uploader__progress {
          font-size: 0.85rem;
          color: var(--primary);
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}
