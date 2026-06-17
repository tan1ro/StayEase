import { useState } from 'react';
import { Trash2, Upload, Video } from 'lucide-react';

const MAX_SIZE_MB = 100;
const MAX_VIDEOS = 2;

export default function VideoUploader({ videos = [], onUpload, onDelete, uploading }) {
  const [error, setError] = useState('');

  const handleFile = (file) => {
    setError('');
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Video must be under ${MAX_SIZE_MB}MB`);
      return;
    }
    const allowed = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowed.includes(file.type)) {
      setError('Only MP4, MOV, or WebM allowed');
      return;
    }
    onUpload?.(file);
  };

  if (videos.length >= MAX_VIDEOS) {
    return (
      <div className="video-uploader">
        {videos.map((v) => (
          <div key={v.public_id || v.url} className="video-uploader__preview">
            <video src={v.url} controls />
            <button type="button" onClick={() => onDelete?.(v)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="video-uploader">
      <label className="video-uploader__drop">
        <Video size={24} />
        <Upload size={16} />
        <span>Drop video (MP4/MOV/WebM, max {MAX_SIZE_MB}MB)</span>
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      {error && <p className="video-uploader__error">{error}</p>}
      {uploading && <p>Uploading...</p>}
      {videos.map((v) => (
        <div key={v.public_id || v.url} className="video-uploader__preview">
          <video src={v.url} controls />
          <button type="button" onClick={() => onDelete?.(v)}><Trash2 size={16} /></button>
        </div>
      ))}
      <style>{`
        .video-uploader__drop {
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
        .video-uploader__preview {
          position: relative;
          margin-bottom: 0.75rem;
        }
        .video-uploader__preview video { width: 100%; border-radius: var(--radius-input); }
        .video-uploader__preview button {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: var(--danger);
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .video-uploader__error { color: var(--danger); font-size: 0.85rem; }
      `}</style>
    </div>
  );
}
