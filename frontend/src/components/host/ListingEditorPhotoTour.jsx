import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bath,
  BedDouble,
  ChevronRight,
  ImagePlus,
  Images,
  Plus,
  Trash2,
} from 'lucide-react';
import { Icon, ICON } from '../ui/Icon';
import ConfirmModal from '../ConfirmModal';

const PHOTO_ZONES = [
  { id: 'bedroom', label: 'Bedroom area', icon: BedDouble },
  { id: 'bathroom', label: 'Full bathroom', icon: Bath },
  { id: 'additional', label: 'Additional photos', icon: Images },
];

const ZONE_SETTINGS = {
  bedroom: [
    { id: 'bed', label: 'Bed type', getSummary: (room) => room.bed_configuration?.replace(/_/g, ' ') || 'Add details' },
    { id: 'amenities', label: 'Amenities', getSummary: (room) => (room.amenities?.length ? `${room.amenities.length} added` : 'Add details') },
    { id: 'accessibility', label: 'Accessibility features', getSummary: () => 'Add details' },
  ],
  bathroom: [
    { id: 'privacy', label: 'Privacy info', getSummary: () => 'Dedicated bathroom' },
    { id: 'amenities', label: 'Amenities', getSummary: (room) => (room.amenities?.length ? `${room.amenities.length} added` : 'Add details') },
    { id: 'accessibility', label: 'Accessibility features', getSummary: () => 'Add details' },
  ],
  additional: [],
};

function zonePhotoCount(zoneId, photos) {
  const count = photos?.length || 0;
  if (zoneId === 'bedroom') return count > 0 ? Math.min(count, Math.max(1, Math.ceil(count * 0.6))) : 0;
  if (zoneId === 'bathroom') return 0;
  if (zoneId === 'additional') return count;
  return count;
}

export default function ListingEditorPhotoTour({
  room,
  roomId,
  photos = [],
  uploading,
  onUpload,
  onDelete,
}) {
  const [activeZone, setActiveZone] = useState('bathroom');
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const fileRef = useRef(null);
  const zone = PHOTO_ZONES.find((z) => z.id === activeZone) || PHOTO_ZONES[0];
  const settings = ZONE_SETTINGS[activeZone] || [];
  const zonePhotos = activeZone === 'additional' ? photos : photos.slice(0, activeZone === 'bedroom' ? 4 : 0);
  const photoCount = zonePhotoCount(activeZone, photos);

  const handleFiles = (files) => {
    Array.from(files || []).forEach((file) => onUpload?.(file));
  };

  return (
    <div className="host-editor__photo-tour">
      <div className="host-editor__photo-tour-layout">
        <aside className="host-editor__zone-nav">
          {PHOTO_ZONES.map((z) => {
            const ZoneIcon = z.icon;
            const thumb = z.id === 'additional' && photos[0]?.url
              ? photos[0].url
              : z.id === 'bedroom' && photos[0]?.url
                ? photos[0].url
                : null;
            const count = zonePhotoCount(z.id, photos);

            return (
              <button
                key={z.id}
                type="button"
                className={`host-editor__zone-nav-item ${activeZone === z.id ? 'host-editor__zone-nav-item--active' : ''}`}
                onClick={() => setActiveZone(z.id)}
              >
                <div className="host-editor__zone-thumb">
                  {thumb ? (
                    <img src={thumb} alt="" />
                  ) : (
                    <Icon icon={ZoneIcon} size={ICON.lg} />
                  )}
                </div>
                <span>{z.label}</span>
                {count > 0 && <em>{count} photo{count !== 1 ? 's' : ''}</em>}
              </button>
            );
          })}
        </aside>

        <div className="host-editor__zone-detail">
          <div className="host-editor__zone-header">
            <h1>{zone.label}</h1>
            <button
              type="button"
              className="host-editor__zone-add-btn"
              aria-label="Add photo"
              onClick={() => fileRef.current?.click()}
            >
              <Icon icon={Plus} size={ICON.md} />
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />

          {zonePhotos.length > 0 ? (
            <div className="host-editor__photo-drop host-editor__photo-drop--filled">
              <div className="host-editor__photo-grid">
                {zonePhotos.map((photo) => (
                  <div key={photo.public_id || photo.url} className="host-editor__photo-tile">
                    <img src={photo.url} alt="" />
                    <button type="button" className="host-editor__photo-delete" onClick={() => setPhotoToDelete(photo)} aria-label="Delete photo">
                      <Icon icon={Trash2} size={ICON.sm} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="host-editor__photo-add-btn" onClick={() => fileRef.current?.click()}>
                Add photo
              </button>
            </div>
          ) : (
            <label
              className="host-editor__photo-drop"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
            >
              <Icon icon={zone.icon} size={48} className="host-editor__photo-drop-icon" />
              <button
                type="button"
                className="host-editor__photo-add-btn"
                onClick={(e) => {
                  e.preventDefault();
                  fileRef.current?.click();
                }}
              >
                <Icon icon={ImagePlus} size={ICON.sm} />
                Add photo
              </button>
            </label>
          )}

          {uploading && <p className="host-editor__uploading">Uploading…</p>}

          {settings.length > 0 && (
            <div className="host-editor__settings-group">
              {settings.map((row, index) => (
                <Link
                  key={row.id}
                  to={`/host/rooms/edit/${roomId}`}
                  className={`host-editor__settings-row ${index === 0 ? 'host-editor__settings-row--highlight' : ''}`}
                >
                  <div>
                    <strong>{row.label}</strong>
                    <span>{row.getSummary(room)}</span>
                  </div>
                  <Icon icon={ChevronRight} size={ICON.md} />
                </Link>
              ))}
            </div>
          )}

          {activeZone !== 'additional' && (
            <button type="button" className="host-editor__zone-delete" disabled>
              <Icon icon={Trash2} size={ICON.sm} />
              Delete room or space
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!photoToDelete}
        onClose={() => {
          if (deleting) return;
          setPhotoToDelete(null);
          setDeleteError('');
        }}
        onConfirm={async () => {
          if (!photoToDelete || deleting) return;
          setDeleting(true);
          setDeleteError('');
          try {
            await onDelete?.(photoToDelete);
            setPhotoToDelete(null);
          } catch (err) {
            setDeleteError(err?.message || 'Could not delete photo. Please try again.');
          } finally {
            setDeleting(false);
          }
        }}
        title="Delete photo?"
        message="Are you sure you want to delete this photo? This cannot be undone."
        confirmLabel="Delete photo"
        confirming={deleting}
        error={deleteError}
      />
    </div>
  );
}
