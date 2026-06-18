import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AmenityPicker from '../../components/AmenityPicker';
import ErrorMessage from '../../components/ErrorMessage';
import ImageUploader from '../../components/ImageUploader';
import { ROOM_CATEGORIES } from '../../constants/roomCategories';
import { roomsApi } from '../../api/api';

const VIEWS = ['none', 'hill_view', 'beach_view', 'garden_view', 'city_view', 'pool_view'];

export const defaultForm = {
  title: '',
  room_number: '',
  description: '',
  room_category: 'Double',
  price_per_night: 2000,
  max_guests: 2,
  food_preference: 'veg',
  smoking_policy: 'non_smoking',
  alcohol_policy: 'non_alcohol',
  view_type: 'none',
  has_balcony: false,
  amenities: [],
  location: {
    address: '',
    city: '',
    area: '',
    pincode: '',
    lat: 12.97,
    lng: 77.59,
  },
  policies: {
    check_in_time: '14:00',
    check_out_time: '11:00',
    cancellation: 'moderate',
    pet_allowed: false,
    smoking_allowed: false,
    alcohol_allowed: false,
  },
  is_available: false,
};

function bedConfigFromCount(count) {
  if (count <= 1) return 'single_bed';
  if (count === 2) return 'twin_beds';
  return 'king';
}

export function toApiPayload(form, { isAvailable = false } = {}) {
  const title = form.title.trim().length >= 5 ? form.title.trim() : 'New StayEase listing';
  const description = form.description.trim().length >= 50
    ? form.description.trim()
    : 'A comfortable stay at our property with great amenities, a welcoming host, and everything you need for a relaxing trip.';
  const roomNumber = form.room_number.trim() || `R-${Date.now().toString().slice(-6)}`;

  return {
    room_number: roomNumber,
    title,
    description,
    room_category: form.room_category,
    bed_configuration: bedConfigFromCount(form.bed_count || 1),
    price_per_night: form.price_per_night,
    max_guests: Math.min(form.max_guests, 10),
    amenities: form.amenities,
    location: form.location,
    food_preference: form.food_preference,
    smoking_policy: form.smoking_policy,
    alcohol_policy: form.alcohol_policy,
    view_type: form.view_type,
    has_balcony: form.has_balcony,
    policies: form.policies,
    is_available: isAvailable,
  };
}

export default function RoomForm({ initial = defaultForm, roomId, isEdit }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ...defaultForm,
    ...initial,
    location: { ...defaultForm.location, ...(initial.location || {}) },
    policies: { ...defaultForm.policies, ...(initial.policies || {}) },
    amenities: initial.amenities || [],
  });
  const [photos, setPhotos] = useState(initial.photos || []);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setLoc = (key, val) => setForm((f) => ({ ...f, location: { ...f.location, [key]: val } }));
  const setPol = (key, val) => setForm((f) => ({ ...f, policies: { ...f.policies, [key]: val } }));

  const save = async (publish) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = toApiPayload(form, { isAvailable: publish });
      if (isEdit) {
        await roomsApi.update(roomId, payload);
      } else {
        await roomsApi.create(payload);
      }
      setSuccess(publish ? 'Listing published successfully.' : 'Draft saved successfully.');
      setTimeout(() => navigate('/host/rooms'), 1200);
    } catch (err) {
      setError(err.normalized?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!roomId) return;
    setUploading(true);
    try {
      const { data } = await roomsApi.uploadPhoto(roomId, file);
      setPhotos((prev) => {
        const next = [...(prev || []), data].filter((p) => p && p.url);
        const hasPrimary = next.some((p) => p.is_primary);
        if (!hasPrimary && next.length) next[0] = { ...next[0], is_primary: true };
        return next;
      });
    } catch (err) {
      setError(err.normalized?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleReorderPhotos = async (next) => {
    setPhotos(next);
    try {
      await roomsApi.reorderPhotos(roomId, next.map((p) => p.public_id).filter(Boolean));
    } catch {
      // keep local order on failure
    }
  };

  const handleDeletePhoto = async (photo) => {
    const pid = photo?.public_id;
    if (!pid) {
      setPhotos((prev) => (prev || []).filter((p) => p !== photo));
      return;
    }
    try {
      await roomsApi.deletePhoto(roomId, pid);
      setPhotos((prev) => (prev || []).filter((p) => p?.public_id !== pid));
    } catch (err) {
      throw new Error(err.normalized?.message || 'Could not delete photo');
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <ErrorMessage message={error} />
      {success && (
        <p className="form-success" role="status" style={{ color: 'var(--success)', marginBottom: '1rem' }}>
          {success}
        </p>
      )}

      <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2>Basic Info</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Room Number</label>
            <input className="input" value={form.room_number} onChange={(e) => set('room_number', e.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label className="label">Description (min 50 chars)</label>
          <textarea className="textarea" value={form.description} onChange={(e) => set('description', e.target.value)} required minLength={50} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Category</label>
            <select className="select" value={form.room_category} onChange={(e) => set('room_category', e.target.value)}>
              {ROOM_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Max guests</label>
            <input type="number" className="input" min={1} max={10} value={form.max_guests} onChange={(e) => set('max_guests', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="label">Price/night (₹)</label>
            <input type="number" className="input" min={100} value={form.price_per_night} onChange={(e) => set('price_per_night', Number(e.target.value))} required />
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2>Location</h2>
        <div className="form-group">
          <label className="label">Address</label>
          <input className="input" value={form.location.address} onChange={(e) => setLoc('address', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">City</label>
            <input className="input" value={form.location.city} onChange={(e) => setLoc('city', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Area</label>
            <input className="input" value={form.location.area} onChange={(e) => setLoc('area', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Pincode</label>
            <input className="input" value={form.location.pincode || ''} onChange={(e) => setLoc('pincode', e.target.value)} inputMode="numeric" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Latitude</label>
            <input type="number" step="any" className="input" value={form.location.lat} onChange={(e) => setLoc('lat', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="label">Longitude</label>
            <input type="number" step="any" className="input" value={form.location.lng} onChange={(e) => setLoc('lng', Number(e.target.value))} />
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2>Preferences &amp; policies</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Food preference</label>
            <select className="select" value={form.food_preference} onChange={(e) => set('food_preference', e.target.value)}>
              <option value="veg">Veg</option>
              <option value="non_veg">Non-veg</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Smoking policy</label>
            <select className="select" value={form.smoking_policy} onChange={(e) => set('smoking_policy', e.target.value)}>
              <option value="non_smoking">Non-smoking</option>
              <option value="smoking">Smoking allowed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Alcohol policy</label>
            <select className="select" value={form.alcohol_policy} onChange={(e) => set('alcohol_policy', e.target.value)}>
              <option value="non_alcohol">No alcohol</option>
              <option value="alcohol">Alcohol allowed</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">View type</label>
            <select className="select" value={form.view_type} onChange={(e) => set('view_type', e.target.value)}>
              {VIEWS.map((v) => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Balcony</label>
            <select className="select" value={form.has_balcony ? 'yes' : 'no'} onChange={(e) => set('has_balcony', e.target.value === 'yes')}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Check-in time</label>
            <input className="input" type="time" value={form.policies.check_in_time} onChange={(e) => setPol('check_in_time', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Check-out time</label>
            <input className="input" type="time" value={form.policies.check_out_time} onChange={(e) => setPol('check_out_time', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Cancellation</label>
            <select className="select" value={form.policies.cancellation} onChange={(e) => setPol('cancellation', e.target.value)}>
              <option value="flexible">Flexible</option>
              <option value="moderate">Moderate</option>
              <option value="strict">Strict</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card amenity-picker-section" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2>Amenities</h2>
        <AmenityPicker selected={form.amenities} onChange={(next) => set('amenities', next)} />
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

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="button" className="btn btn-outline" onClick={() => save(false)} disabled={loading}>
          {loading ? 'Saving…' : 'Save Draft'}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => save(true)} disabled={loading}>
          {loading ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </form>
  );
}
