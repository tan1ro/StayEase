import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AmenityPicker from '../../components/AmenityPicker';
import ErrorMessage from '../../components/ErrorMessage';
import ImageUploader from '../../components/ImageUploader';
import Spinner from '../../components/Spinner';
import { roomsApi } from '../../api/api';

const ROOM_CATEGORIES = ['Single', 'Double', 'Triple', 'Suite', 'Villa'];
const VIEW_TYPES = ['city_view', 'garden_view', 'sea_view', 'hill_view', 'no_view'];

const EMPTY_FORM = {
  title: '',
  room_number: '',
  room_category: 'Double',
  description: '',
  max_guests: 2,
  price_per_night: 2000,
  address: '',
  city: '',
  area: '',
  pincode: '',
  latitude: 12.97,
  longitude: 77.59,
  amenities: [],
  food_preference: 'veg',
  smoking_policy: 'non_smoking',
  alcohol_policy: 'non_alcohol',
  view_type: 'no_view',
  has_balcony: false,
};

function bedConfigFromGuests(count) {
  if (count <= 1) return 'single_bed';
  if (count === 2) return 'twin_beds';
  return 'king';
}

function mapRoomToForm(room) {
  const loc = room.location || {};
  return {
    title: room.title || '',
    room_number: room.room_number || '',
    room_category: room.room_category || 'Double',
    description: room.description || '',
    max_guests: room.max_guests ?? 2,
    price_per_night: room.price_per_night ?? 2000,
    address: loc.address || '',
    city: loc.city || '',
    area: loc.area || '',
    pincode: loc.pincode || '',
    latitude: loc.lat ?? 12.97,
    longitude: loc.lng ?? 77.59,
    amenities: room.amenities || [],
    food_preference: room.food_preference || 'veg',
    smoking_policy: room.smoking_policy || 'non_smoking',
    alcohol_policy: room.alcohol_policy || 'non_alcohol',
    view_type: room.view_type || 'no_view',
    has_balcony: Boolean(room.has_balcony),
  };
}

function buildPayload(form, isAvailable) {
  return {
    room_number: form.room_number.trim(),
    title: form.title.trim(),
    description: form.description.trim(),
    room_category: form.room_category,
    bed_configuration: bedConfigFromGuests(form.max_guests),
    price_per_night: Number(form.price_per_night),
    max_guests: Number(form.max_guests),
    amenities: form.amenities,
    location: {
      address: form.address.trim(),
      city: form.city.trim(),
      area: form.area.trim(),
      pincode: form.pincode.trim(),
      lat: Number(form.latitude),
      lng: Number(form.longitude),
    },
    food_preference: form.food_preference,
    smoking_policy: form.smoking_policy,
    alcohol_policy: form.alcohol_policy,
    view_type: form.view_type,
    has_balcony: form.has_balcony,
    policies: {
      check_in_time: '14:00',
      check_out_time: '11:00',
      cancellation: 'moderate',
      pet_allowed: false,
      smoking_allowed: form.smoking_policy === 'smoking',
      alcohol_allowed: form.alcohol_policy === 'alcohol',
    },
    is_available: isAvailable,
  };
}

function validateForm(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Title is required';
  if (!form.room_number.trim()) errors.room_number = 'Room number is required';
  if (!form.description.trim()) errors.description = 'Description is required';
  if (!form.room_category) errors.room_category = 'Category is required';
  if (!form.city.trim()) errors.city = 'City is required';
  if (!form.address.trim()) errors.address = 'Address is required';
  if (!form.price_per_night || Number(form.price_per_night) < 100) {
    errors.price_per_night = 'Price must be at least ₹100';
  }
  if (!form.max_guests || Number(form.max_guests) < 1) {
    errors.max_guests = 'At least 1 guest required';
  }
  return errors;
}

export default function RoomForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [photos, setPhotos] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setFetching(true);
    setError('');
    roomsApi.get(id)
      .then(({ data }) => {
        setForm(mapRoomToForm(data));
        setPhotos(data.photos || []);
      })
      .catch((err) => setError(err.normalized?.message || 'Failed to load room'))
      .finally(() => setFetching(false));
  }, [id]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const save = async (publish) => {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = buildPayload(form, publish);
      if (isEdit) {
        await roomsApi.update(id, payload);
      } else {
        await roomsApi.create(payload);
      }
      setSuccess(publish ? 'Listing published successfully.' : 'Draft saved successfully.');
      setTimeout(() => navigate('/host/rooms'), 1500);
    } catch (err) {
      setError(err.normalized?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!id) return;
    setUploading(true);
    try {
      const { data } = await roomsApi.uploadPhoto(id, file);
      setPhotos((prev) => [...(prev || []), data].filter((p) => p?.url));
    } catch (err) {
      setError(err.normalized?.message || 'Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleReorderPhotos = async (next) => {
    setPhotos(next);
    if (!id) return;
    try {
      await roomsApi.reorderPhotos(id, next.map((p) => p.public_id).filter(Boolean));
    } catch {
      /* keep local order */
    }
  };

  const handleDeletePhoto = async (photo) => {
    const pid = photo?.public_id;
    if (!pid) {
      setPhotos((prev) => prev.filter((p) => p !== photo));
      return;
    }
    await roomsApi.deletePhoto(id, pid);
    setPhotos((prev) => prev.filter((p) => p?.public_id !== pid));
  };

  if (fetching) return <Spinner label="Loading room..." />;

  return (
    <div className="page">
      <h1 className="page-title">{isEdit ? 'Edit room' : 'Add room'}</h1>

      <ErrorMessage message={error} />
      {success && (
        <p className="account-settings__alert account-settings__alert--success" role="status">
          {success}
        </p>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h2>Basic info</h2>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Title *</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                aria-invalid={!!fieldErrors.title}
              />
              {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
            </div>
            <div className="form-group">
              <label className="label">Room number *</label>
              <input
                className="input"
                value={form.room_number}
                onChange={(e) => set('room_number', e.target.value)}
                aria-invalid={!!fieldErrors.room_number}
              />
              {fieldErrors.room_number && <span className="field-error">{fieldErrors.room_number}</span>}
            </div>
          </div>
          <div className="form-group">
            <label className="label">Description *</label>
            <textarea
              className="textarea"
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              aria-invalid={!!fieldErrors.description}
            />
            {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Category *</label>
              <select
                className="select"
                value={form.room_category}
                onChange={(e) => set('room_category', e.target.value)}
              >
                {ROOM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Max guests *</label>
              <input
                type="number"
                className="input"
                min={1}
                max={10}
                value={form.max_guests}
                onChange={(e) => set('max_guests', Number(e.target.value))}
              />
              {fieldErrors.max_guests && <span className="field-error">{fieldErrors.max_guests}</span>}
            </div>
            <div className="form-group">
              <label className="label">Price per night (₹) *</label>
              <input
                type="number"
                className="input"
                min={100}
                value={form.price_per_night}
                onChange={(e) => set('price_per_night', Number(e.target.value))}
              />
              {fieldErrors.price_per_night && <span className="field-error">{fieldErrors.price_per_night}</span>}
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h2>Location</h2>
          <div className="form-group">
            <label className="label">Address *</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
            {fieldErrors.address && <span className="field-error">{fieldErrors.address}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">City *</label>
              <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} />
              {fieldErrors.city && <span className="field-error">{fieldErrors.city}</span>}
            </div>
            <div className="form-group">
              <label className="label">Area</label>
              <input className="input" value={form.area} onChange={(e) => set('area', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Pincode</label>
              <input className="input" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Latitude</label>
              <input
                type="number"
                step="any"
                className="input"
                value={form.latitude}
                onChange={(e) => set('latitude', Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="label">Longitude</label>
              <input
                type="number"
                step="any"
                className="input"
                value={form.longitude}
                onChange={(e) => set('longitude', Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h2>Preferences</h2>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Food preference</label>
              <select
                className="select"
                value={form.food_preference}
                onChange={(e) => set('food_preference', e.target.value)}
              >
                <option value="veg">Veg</option>
                <option value="nonveg">Non-veg</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Smoking policy</label>
              <select
                className="select"
                value={form.smoking_policy}
                onChange={(e) => set('smoking_policy', e.target.value)}
              >
                <option value="non_smoking">Non-smoking</option>
                <option value="smoking">Smoking allowed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Alcohol policy</label>
              <select
                className="select"
                value={form.alcohol_policy}
                onChange={(e) => set('alcohol_policy', e.target.value)}
              >
                <option value="non_alcohol">Non-alcohol</option>
                <option value="alcohol">Alcohol allowed</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">View type</label>
              <select
                className="select"
                value={form.view_type}
                onChange={(e) => set('view_type', e.target.value)}
              >
                {VIEW_TYPES.map((v) => (
                  <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Balcony</label>
              <select
                className="select"
                value={form.has_balcony ? 'yes' : 'no'}
                onChange={(e) => set('has_balcony', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
        </section>

        <section className="card amenity-picker-section" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
          <h2>Amenities</h2>
          <AmenityPicker
            selected={form.amenities}
            onChange={(next) => set('amenities', next)}
          />
        </section>

        {isEdit && (
          <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <h2>Photos</h2>
            <ImageUploader
              photos={photos}
              onUpload={handlePhotoUpload}
              uploading={uploading}
              onReorder={handleReorderPhotos}
              onDelete={handleDeletePhoto}
            />
          </section>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => save(false)}
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Save as Draft'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => save(true)}
            disabled={loading}
          >
            {loading ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Re-export helpers for AddRoom wizard compatibility
export { EMPTY_FORM as defaultForm, buildPayload as toApiPayload };
