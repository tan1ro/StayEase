import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorMessage from '../ErrorMessage';
import AmenityPicker from '../AmenityPicker';
import { formatCurrency } from '../../api/api';
import { ROOM_CATEGORIES } from '../../constants/roomCategories';
import { FACING_OPTIONS } from '../../constants/roomPlacement';
import { guestPaysPerNightInclGst, listingPricePreview } from '../../utils/listingPricePreview';
import { getAvatarUrl } from '../../utils/roomImages';
import SafeImage from '../SafeImage';

const BED_OPTIONS = [
  { value: 'single_bed', label: 'Single bed' },
  { value: 'double_bed', label: 'Double bed' },
  { value: 'queen_bed', label: 'Queen bed' },
  { value: 'king_bed', label: 'King bed' },
  { value: 'twin_beds', label: 'Twin beds' },
  { value: 'bunk_bed', label: 'Bunk bed' },
  { value: 'sofa_bed', label: 'Sofa bed' },
];

const VIEW_OPTIONS = [
  { value: 'none', label: 'Standard view' },
  { value: 'city_view', label: 'City view' },
  { value: 'garden_view', label: 'Garden view' },
  { value: 'hill_view', label: 'Hill view' },
  { value: 'sea_view', label: 'Sea view' },
  { value: 'beach_view', label: 'Beach view' },
  { value: 'pool_view', label: 'Pool view' },
];

function EditorSaveBar({ onSave, saving, disabled }) {
  return (
    <div className="host-editor__savebar">
      <button type="button" className="btn btn-primary" onClick={onSave} disabled={disabled || saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function hostSince(createdAt) {
  if (!createdAt) return new Date().getFullYear();
  return new Date(createdAt).getFullYear();
}

export default function ListingEditorSpacePanel({
  section,
  room,
  onSave,
  onDraftChange,
  saving,
  error,
}) {
  const [title, setTitle] = useState(room.title || '');
  const [price, setPrice] = useState(room.price_per_night || 0);
  const [maxGuests, setMaxGuests] = useState(room.max_guests || 2);
  const [description, setDescription] = useState(room.description || '');
  const [isAvailable, setIsAvailable] = useState(room.is_available ?? false);
  const [roomCategory, setRoomCategory] = useState(room.room_category || 'Double');
  const [bedConfig, setBedConfig] = useState(room.bed_configuration || 'double_bed');
  const [foodPreference, setFoodPreference] = useState(room.food_preference || 'veg');
  const [viewType, setViewType] = useState(room.view_type || 'none');
  const [facingSide, setFacingSide] = useState(room.facing_side || 'none');
  const [floorLabel, setFloorLabel] = useState(room.floor_label || '');
  const [viewDescription, setViewDescription] = useState(room.view_description || '');
  const [amenities, setAmenities] = useState(room.amenities || []);
  const [location, setLocation] = useState({
    address: room.location?.address || '',
    area: room.location?.area || '',
    city: room.location?.city || '',
    state: room.location?.state || '',
    pincode: room.location?.pincode || '',
    lat: room.location?.lat || 0,
    lng: room.location?.lng || 0,
  });

  useEffect(() => {
    setTitle(room.title || '');
    setPrice(room.price_per_night || 0);
    setMaxGuests(room.max_guests || 2);
    setDescription(room.description || '');
    setIsAvailable(room.is_available ?? false);
    setRoomCategory(room.room_category || 'Double');
    setBedConfig(room.bed_configuration || 'double_bed');
    setFoodPreference(room.food_preference || 'veg');
    setViewType(room.view_type || 'none');
    setFacingSide(room.facing_side || 'none');
    setFloorLabel(room.floor_label || '');
    setViewDescription(room.view_description || '');
    setAmenities(room.amenities || []);
    setLocation({
      address: room.location?.address || '',
      area: room.location?.area || '',
      city: room.location?.city || '',
      state: room.location?.state || '',
      pincode: room.location?.pincode || '',
      lat: room.location?.lat || 0,
      lng: room.location?.lng || 0,
    });
  }, [room]);

  const preview = listingPricePreview(price);
  const guestNightly = guestPaysPerNightInclGst(price);
  const host = room.host;

  const patchDraft = (patch) => onDraftChange?.(patch);

  if (section === 'title') {
    return (
      <>
        <h1>Title</h1>
        <p className="host-page__subtitle">A short headline guests see in search results.</p>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card">
          <label className="label">Listing title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              patchDraft({ title: e.target.value });
            }}
            minLength={5}
            maxLength={120}
            placeholder="Cozy double room with garden view"
          />
        </div>
        <EditorSaveBar
          saving={saving}
          disabled={title.trim().length < 5}
          onSave={() => onSave({ title: title.trim() })}
        />
      </>
    );
  }

  if (section === 'type') {
    return (
      <>
        <h1>Property type</h1>
        <p className="host-page__subtitle">Room category, bed setup, and dining preferences.</p>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card">
          <label className="label">Room category</label>
          <select
            className="select"
            value={roomCategory}
            onChange={(e) => {
              setRoomCategory(e.target.value);
              patchDraft({ room_category: e.target.value });
            }}
          >
            {ROOM_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <label className="label" style={{ marginTop: '1rem' }}>Bed configuration</label>
          <select
            className="select"
            value={bedConfig}
            onChange={(e) => {
              setBedConfig(e.target.value);
              patchDraft({ bed_configuration: e.target.value });
            }}
          >
            {BED_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
          <label className="label" style={{ marginTop: '1rem' }}>Food preference</label>
          <select
            className="select"
            value={foodPreference}
            onChange={(e) => {
              setFoodPreference(e.target.value);
              patchDraft({ food_preference: e.target.value });
            }}
          >
            <option value="veg">Pure veg</option>
            <option value="both">Veg &amp; non-veg</option>
            <option value="nonveg">Non-veg only</option>
          </select>
          <label className="label" style={{ marginTop: '1rem' }}>View</label>
          <select
            className="select"
            value={viewType}
            onChange={(e) => {
              setViewType(e.target.value);
              patchDraft({ view_type: e.target.value });
            }}
          >
            {VIEW_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          <label className="label" style={{ marginTop: '1rem' }}>Facing side</label>
          <select
            className="select"
            value={facingSide}
            onChange={(e) => {
              setFacingSide(e.target.value);
              patchDraft({ facing_side: e.target.value });
            }}
          >
            {FACING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <label className="label" style={{ marginTop: '1rem' }}>Floor (optional)</label>
          <input
            className="input"
            value={floorLabel}
            onChange={(e) => {
              setFloorLabel(e.target.value);
              patchDraft({ floor_label: e.target.value });
            }}
            placeholder="e.g. 4th floor, Ground floor"
            maxLength={40}
          />
          <label className="label" style={{ marginTop: '1rem' }}>View description (optional)</label>
          <textarea
            className="textarea"
            rows={3}
            value={viewDescription}
            onChange={(e) => {
              setViewDescription(e.target.value);
              patchDraft({ view_description: e.target.value });
            }}
            placeholder="e.g. East-facing balcony overlooks the pool and morning sunrise."
            maxLength={300}
          />
        </div>
        <EditorSaveBar
          saving={saving}
          onSave={() => onSave({
            room_category: roomCategory,
            bed_configuration: bedConfig,
            food_preference: foodPreference,
            view_type: viewType,
            facing_side: facingSide,
            floor_label: floorLabel.trim() || null,
            view_description: viewDescription.trim() || null,
          })}
        />
      </>
    );
  }

  if (section === 'pricing') {
    return (
      <>
        <h1>Pricing</h1>
        <p className="host-page__subtitle">Set your base nightly rate. Guests see the total including taxes and service fees.</p>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card">
          <label className="label">Base price per night (₹)</label>
          <input
            className="input"
            type="number"
            min={100}
            step={50}
            value={price}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPrice(next);
              patchDraft({ price_per_night: next });
            }}
          />
          <div className="host-editor__price-preview">
            <p><strong>Guest pays:</strong> {formatCurrency(guestNightly)} / night incl. GST</p>
            <p><strong>You earn:</strong> ~{formatCurrency(preview.hostEarns)} / night before taxes</p>
          </div>
        </div>
        <EditorSaveBar saving={saving} disabled={!price} onSave={() => onSave({ price_per_night: price })} />
      </>
    );
  }

  if (section === 'availability') {
    return (
      <>
        <h1>Availability</h1>
        <p className="host-page__subtitle">Control whether guests can find and book your listing.</p>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card">
          <label className="host-editor__toggle-row">
            <div>
              <strong>Published</strong>
              <span>When on, your listing appears in search and can receive bookings.</span>
            </div>
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => {
                setIsAvailable(e.target.checked);
                patchDraft({ is_available: e.target.checked });
              }}
            />
          </label>
        </div>
        <EditorSaveBar saving={saving} onSave={() => onSave({ is_available: isAvailable })} />
      </>
    );
  }

  if (section === 'guests') {
    return (
      <>
        <h1>Number of guests</h1>
        <p className="host-page__subtitle">How many guests can stay in this room?</p>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card">
          <label className="label">Maximum guests</label>
          <input
            className="input"
            type="number"
            min={1}
            max={10}
            value={maxGuests}
            onChange={(e) => {
              const next = Number(e.target.value);
              setMaxGuests(next);
              patchDraft({ max_guests: next });
            }}
          />
        </div>
        <EditorSaveBar saving={saving} disabled={maxGuests < 1} onSave={() => onSave({ max_guests: maxGuests })} />
      </>
    );
  }

  if (section === 'description') {
    return (
      <>
        <h1>Description</h1>
        <p className="host-page__subtitle">Tell guests what makes your space special.</p>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card">
          <textarea
            className="textarea"
            rows={10}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              patchDraft({ description: e.target.value });
            }}
            placeholder="Describe the room, neighbourhood, and what guests will love about staying here."
          />
        </div>
        <EditorSaveBar saving={saving} disabled={description.trim().length < 50} onSave={() => onSave({ description })} />
      </>
    );
  }

  if (section === 'amenities') {
    return (
      <>
        <h1>Amenities</h1>
        <p className="host-page__subtitle">Select what your property offers.</p>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card amenity-picker-section">
          <AmenityPicker
            selected={amenities}
            onChange={(next) => {
              setAmenities(next);
              patchDraft({ amenities: next });
            }}
          />
        </div>
        <EditorSaveBar saving={saving} onSave={() => onSave({ amenities })} />
      </>
    );
  }

  if (section === 'location') {
    const updateLoc = (key, val) => {
      setLocation((prev) => {
        const next = { ...prev, [key]: val };
        patchDraft({ location: next });
        return next;
      });
    };

    return (
      <>
        <h1>Location</h1>
        <p className="host-page__subtitle">Where guests will find your property.</p>
        <ErrorMessage message={error} />
        <div className="host-editor__inner-card">
          <label className="label">Street address</label>
          <input className="input" value={location.address} onChange={(e) => updateLoc('address', e.target.value)} />
          <div className="host-editor__time-grid" style={{ marginTop: '1rem' }}>
            <label className="host-editor__time-field">
              <span className="host-editor__time-field-label">Area</span>
              <input className="input" value={location.area} onChange={(e) => updateLoc('area', e.target.value)} />
            </label>
            <label className="host-editor__time-field">
              <span className="host-editor__time-field-label">City</span>
              <input className="input" value={location.city} onChange={(e) => updateLoc('city', e.target.value)} />
            </label>
          </div>
          <div className="host-editor__time-grid" style={{ marginTop: '1rem' }}>
            <label className="host-editor__time-field">
              <span className="host-editor__time-field-label">State</span>
              <input className="input" value={location.state || ''} onChange={(e) => updateLoc('state', e.target.value)} />
            </label>
            <label className="host-editor__time-field">
              <span className="host-editor__time-field-label">Pincode</span>
              <input className="input" value={location.pincode || ''} onChange={(e) => updateLoc('pincode', e.target.value)} />
            </label>
          </div>
          {location.lat && location.lng ? (
            <a
              className="host-editor__map-link"
              href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Google Maps
            </a>
          ) : null}
        </div>
        <EditorSaveBar
          saving={saving}
          disabled={!location.city?.trim() || !location.area?.trim()}
          onSave={() => onSave({ location })}
        />
      </>
    );
  }

  if (section === 'host') {
    return (
      <>
        <h1>About the host</h1>
        <p className="host-page__subtitle">This is how guests see you on your listing.</p>
        <div className="host-editor__host-card">
          <SafeImage
            src={host?.avatar_url || getAvatarUrl(host?.name, host?.id || host?.name)}
            alt=""
            className="host-editor__host-avatar"
          />
          <div>
            <strong>{host?.name || 'Your name'}</strong>
            <span>Started hosting in {hostSince(host?.created_at)}</span>
            {host?.about_me && <p>{host.about_me}</p>}
          </div>
        </div>
        <Link to="/host/settings" className="btn btn-outline" style={{ marginTop: '1rem' }}>Edit host profile</Link>
      </>
    );
  }

  return null;
}
