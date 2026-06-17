import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Camera,
  Eye,
  FileText,
  Settings,
  Shield,
  Type,
} from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import ImageUploader from '../../components/ImageUploader';
import { Icon, ICON } from '../../components/ui/Icon';
import { roomsApi } from '../../api/api';

const SPACE_SECTIONS = [
  { id: 'photos', label: 'Photo tour', icon: Camera },
  { id: 'title', label: 'Title', icon: Type },
  { id: 'type', label: 'Property type', icon: BedDouble },
  { id: 'sleeping', label: 'Sleeping arrangements', icon: BedDouble },
];

const ARRIVAL_SECTIONS = [
  { id: 'checkin', label: 'Check-in & checkout', icon: FileText },
  { id: 'safety', label: 'Guest safety', icon: Shield },
  { id: 'rules', label: 'House rules', icon: Shield },
];

export default function ListingEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [tab, setTab] = useState('space');
  const [section, setSection] = useState('photos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = () => {
    roomsApi.get(id)
      .then(({ data }) => setRoom(data))
      .catch((err) => setError(err.normalized?.message || 'Listing not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handlePhotoUpload = async (file) => {
    setUploading(true);
    try {
      const { data } = await roomsApi.uploadPhoto(id, file);
      setRoom((r) => ({ ...r, photos: data.photos }));
    } catch (err) {
      setError(err.normalized?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!room) return null;

  const sections = tab === 'space' ? SPACE_SECTIONS : ARRIVAL_SECTIONS;
  const photoCount = room.photos?.length || 0;

  return (
    <div className="host-editor">
      <aside className="host-editor__sidebar">
        <div className="host-editor__sidebar-header">
          <Link to="/host/rooms" className="host-editor__back">
            <Icon icon={ArrowLeft} size={ICON.md} />
          </Link>
          <h2>Listing editor</h2>
          <button type="button" className="host-icon-btn" aria-label="Settings" onClick={() => navigate(`/host/rooms/${id}/preferences`)}>
            <Icon icon={Settings} size={ICON.md} />
          </button>
        </div>

        <div className="host-editor__tabs">
          <button type="button" className={tab === 'space' ? 'active' : ''} onClick={() => { setTab('space'); setSection('photos'); }}>Your space</button>
          <button type="button" className={tab === 'arrival' ? 'active' : ''} onClick={() => { setTab('arrival'); setSection('checkin'); }}>Arrival guide</button>
        </div>

        {!room.is_available && (
          <div className="host-editor__alert">
            <span className="host-alert-banner__dot" />
            Complete required steps
          </div>
        )}

        <nav className="host-editor__nav">
          {sections.map(({ id: sid, label, icon }) => {
            const summary = sid === 'photos'
              ? `${photoCount} photo${photoCount !== 1 ? 's' : ''}`
              : sid === 'title'
                ? room.title || 'Add title'
                : sid === 'type'
                  ? `${room.room_category} · ${room.bed_configuration?.replace(/_/g, ' ')}`
                  : sid === 'sleeping'
                    ? `${room.max_guests} guests · ${room.bed_configuration?.replace(/_/g, ' ')}`
                    : sid === 'checkin'
                      ? `${room.policies?.check_in_time || '14:00'} check-in`
                      : 'Add details';
            return (
              <button
                key={sid}
                type="button"
                className={`host-editor__nav-item ${section === sid ? 'host-editor__nav-item--active' : ''}`}
                onClick={() => setSection(sid)}
              >
                <Icon icon={icon} size={ICON.sm} />
                <div>
                  <strong>{label}</strong>
                  <span>{summary}</span>
                </div>
                {sid === 'photos' && photoCount > 0 && (
                  <div className="host-editor__thumb">
                    <img src={room.photos[0].url} alt="" />
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        <Link to={`/rooms/${id}`} className="host-editor__preview">
          <Icon icon={Eye} size={ICON.sm} />
          View
        </Link>
      </aside>

      <main className="host-editor__main">
        {section === 'photos' && (
          <>
            <h1>Photo tour</h1>
            <p className="host-page__subtitle">Manage photos for your {room.room_category.toLowerCase()} room. Guests love seeing clean, well-lit spaces.</p>
            <div className="host-editor__photo-zones">
              <div className="host-editor__photo-zone">
                <Icon icon={BedDouble} size={ICON.xl} />
                <strong>Bedroom</strong>
                <span>{photoCount ? `${photoCount} photos` : 'Add photos'}</span>
              </div>
              <div className="host-editor__photo-zone">
                <Icon icon={Bath} size={ICON.xl} />
                <strong>Bathroom</strong>
                <span>Add photos</span>
              </div>
            </div>
            <ImageUploader photos={room.photos || []} onUpload={handlePhotoUpload} uploading={uploading} />
            <Link to={`/host/rooms/edit/${id}`} className="btn btn-outline" style={{ marginTop: '1rem' }}>Edit all details</Link>
          </>
        )}

        {section === 'title' && (
          <>
            <h1>Title</h1>
            <p className="host-page__subtitle">{room.title || 'No title yet'}</p>
            <Link to={`/host/rooms/edit/${id}`} className="btn btn-primary">Edit title &amp; description</Link>
          </>
        )}

        {section === 'type' && (
          <>
            <h1>Property type</h1>
            <p className="host-page__subtitle">{room.room_category} · {room.food_preference} · {room.view_type?.replace(/_/g, ' ') || 'standard view'}</p>
          </>
        )}

        {section === 'sleeping' && (
          <>
            <h1>Sleeping arrangements</h1>
            <p className="host-page__subtitle">{room.max_guests} guests · {room.bed_configuration?.replace(/_/g, ' ')}</p>
          </>
        )}

        {section === 'checkin' && (
          <>
            <h1>Check-in &amp; checkout</h1>
            <div className="host-editor__form card">
              <label className="label">Check-in from</label>
              <p>{room.policies?.check_in_time || '14:00'}</p>
              <label className="label" style={{ marginTop: '1rem' }}>Checkout by</label>
              <p>{room.policies?.check_out_time || '11:00'}</p>
            </div>
          </>
        )}

        {(section === 'safety' || section === 'rules') && (
          <>
            <h1>{section === 'safety' ? 'Guest safety' : 'House rules'}</h1>
            <div className="host-editor__form card">
              <p>Smoking: {room.smoking_policy?.replace(/_/g, ' ') || 'non smoking'}</p>
              <p>Alcohol: {room.alcohol_policy?.replace(/_/g, ' ') || 'non alcohol'}</p>
              <p>Cancellation: {room.policies?.cancellation || 'moderate'}</p>
            </div>
            <Link to={`/host/rooms/edit/${id}`} className="btn btn-outline">Edit policies</Link>
          </>
        )}
      </main>
    </div>
  );
}
