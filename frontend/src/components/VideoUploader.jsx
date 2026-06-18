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
    </div>
  );
}
