import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Settings,
} from 'lucide-react';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import ListingEditorArrivalPanel from '../../components/host/ListingEditorArrivalPanel';
import ListingEditorPhotoTour from '../../components/host/ListingEditorPhotoTour';
import ListingEditorSpacePanel from '../../components/host/ListingEditorSpacePanel';
import { Icon, ICON } from '../../components/ui/Icon';
import { ARRIVAL_SECTIONS, SPACE_SECTIONS } from '../../constants/listingEditorSections';
import { arrivalNavSummary, spaceNavSummary } from '../../utils/listingEditorUtils';
import { roomsApi } from '../../api/api';

export default function ListingEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [tab, setTab] = useState('space');
  const [section, setSection] = useState('photos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftRoom, setDraftRoom] = useState(null);

  const load = () => {
    roomsApi.get(id)
      .then(({ data }) => setRoom(data))
      .catch((err) => setError(err.normalized?.message || 'Listing not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const sectionParam = searchParams.get('section');
    if (tabParam === 'space' || tabParam === 'arrival') setTab(tabParam);
    if (sectionParam) setSection(sectionParam);
  }, [id, searchParams]);

  useEffect(() => {
    setDraftRoom(null);
  }, [section, tab]);

  const handleSave = async (updates) => {
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await roomsApi.update(id, updates);
      setRoom(data);
      setDraftRoom(null);
    } catch (err) {
      setSaveError(err.normalized?.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDraftChange = (patch) => {
    setDraftRoom((prev) => {
      const base = prev || room;
      return {
        ...base,
        ...patch,
        arrival_guide: patch.arrival_guide
          ? { ...(base.arrival_guide || {}), ...patch.arrival_guide }
          : base.arrival_guide,
        policies: patch.policies
          ? { ...(base.policies || {}), ...patch.policies }
          : base.policies,
        location: patch.location
          ? { ...(base.location || {}), ...patch.location }
          : base.location,
      };
    });
  };

  const handlePhotoUpload = async (file) => {
    setUploading(true);
    try {
      const { data } = await roomsApi.uploadPhoto(id, file);
      setRoom((r) => {
        const prev = r?.photos || [];
        const next = [...prev, data].filter((p) => p && p.url);
        const hasPrimary = next.some((p) => p.is_primary);
        if (!hasPrimary && next.length) next[0] = { ...next[0], is_primary: true };
        return { ...r, photos: next };
      });
    } catch (err) {
      setError(err.normalized?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleReorderPhotos = async (next) => {
    setRoom((r) => ({ ...r, photos: next }));
    try {
      await roomsApi.reorderPhotos(id, next.map((p) => p.public_id).filter(Boolean));
    } catch {
      // keep local order on failure
    }
  };

  const handleDeletePhoto = async (photo) => {
    const pid = photo?.public_id;
    if (!pid) return;

    try {
      await roomsApi.deletePhoto(id, pid);
      setRoom((r) => ({ ...r, photos: (r?.photos || []).filter((p) => p?.public_id !== pid) }));
    } catch (err) {
      throw new Error(err.normalized?.message || 'Could not delete photo');
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!room) return null;

  const sections = tab === 'space' ? SPACE_SECTIONS : ARRIVAL_SECTIONS;
  const displayRoom = draftRoom || room;
  const photoCount = room.photos?.length || 0;

  return (
    <div className="host-editor">
      <aside className="host-editor__sidebar">
        <div className="host-editor__sidebar-header">
          <Link to="/host/rooms" className="host-editor__back">
            <Icon icon={ArrowLeft} size={ICON.md} />
          </Link>
          <h2>Listing editor</h2>
          <button type="button" className="host-icon-btn" aria-label="Settings" onClick={() => navigate(`/host/listings/setup?roomId=${id}`)}>
            <Icon icon={Settings} size={ICON.md} />
          </button>
        </div>

        <div className="host-editor__tabs">
          <button type="button" className={tab === 'space' ? 'active' : ''} onClick={() => { setTab('space'); setSection('photos'); }}>Your space</button>
          <button type="button" className={tab === 'arrival' ? 'active' : ''} onClick={() => { setTab('arrival'); setSection('checkin'); }}>Arrival guide</button>
        </div>

        {!room.is_available && (
          <Link to={`/host/listings/setup?roomId=${id}`} className="host-editor__alert host-editor__alert--link">
            <span className="host-alert-banner__dot" />
            Complete required steps
          </Link>
        )}

        <nav className="host-editor__nav" aria-label="Listing sections">
          {sections.map(({ id: sid, label, split }) => {
            const summary = tab === 'space'
              ? spaceNavSummary(sid, displayRoom)
              : arrivalNavSummary(sid, displayRoom);

            return (
              <button
                key={sid}
                type="button"
                className={`host-editor__nav-item ${section === sid ? 'host-editor__nav-item--active' : ''} ${split ? 'host-editor__nav-item--split' : ''}`}
                onClick={() => setSection(sid)}
              >
                <div className="host-editor__nav-content">
                  {!split ? (
                    <>
                      <span className="host-editor__nav-label">{label}</span>
                      <span className="host-editor__nav-summary">
                        {typeof summary === 'string' ? summary : 'Add details'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="host-editor__nav-label">{label}</span>
                      <div className="host-editor__nav-split">
                        <div>
                          <span className="host-editor__nav-split-key">Check-in</span>
                          <span className="host-editor__nav-split-val">{summary.checkIn}</span>
                        </div>
                        <div>
                          <span className="host-editor__nav-split-key">Checkout</span>
                          <span className="host-editor__nav-split-val">{summary.checkOut}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {sid === 'photos' && photoCount > 0 && (
                  <div className="host-editor__thumb" aria-hidden>
                    <img src={room.photos[0].url} alt="" />
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        <Link to={`/host/rooms/${id}/view`} className="host-editor__preview">
          <Icon icon={Eye} size={ICON.sm} />
          View
        </Link>
      </aside>

      <main className="host-editor__main">
        {tab === 'space' && section === 'photos' && (
          <>
            <p className="host-page__subtitle host-editor__photo-tour-intro">
              Manage photos and add details. Guests will only see your tour if every room has a photo.
            </p>
            <ListingEditorPhotoTour
              room={room}
              roomId={id}
              photos={room.photos || []}
              uploading={uploading}
              onUpload={handlePhotoUpload}
              onDelete={handleDeletePhoto}
            />
          </>
        )}

        {tab === 'space' && section !== 'photos' && (
          <ListingEditorSpacePanel
            section={section}
            room={room}
            onSave={handleSave}
            onDraftChange={handleDraftChange}
            saving={saving}
            error={saveError}
          />
        )}

        {tab === 'arrival' && (
          <ListingEditorArrivalPanel
            section={section}
            room={room}
            onSave={handleSave}
            onDraftChange={handleDraftChange}
            saving={saving}
            error={saveError}
          />
        )}
      </main>
    </div>
  );
}
