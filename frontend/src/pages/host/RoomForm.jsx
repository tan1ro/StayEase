import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AmenityPicker from '../../components/AmenityPicker';
import ErrorMessage from '../../components/ErrorMessage';
import Spinner from '../../components/Spinner';
import { roomsApi } from '../../api/api';

const CATEGORIES = ['Single', 'Double', 'Triple', 'Suite', 'Villa'];
const VIEW_TYPES = [
  { value: 'city_view', label: 'City view' },
  { value: 'garden_view', label: 'Garden view' },
  { value: 'sea_view', label: 'Sea view' },
  { value: 'hill_view', label: 'Hill view' },
  { value: 'no_view', label: 'No view' },
];

const DEFAULT_POLICIES = {
  check_in_time: '14:00',
  check_out_time: '11:00',
  cancellation: 'moderate',
  pet_allowed: false,
  smoking_allowed: false,
  alcohol_allowed: false,
};

function bedConfigForCategory(category) {
  if (category === 'Single') return 'single_bed';
  if (category === 'Double') return 'double_bed';
  if (category === 'Triple') return 'twin_beds';
  if (category === 'Suite') return 'king';
  return 'queen';
}

function viewFromApi(viewType) {
  if (!viewType || viewType === 'none') return 'no_view';
  return viewType;
}

function viewToApi(viewType) {
  return viewType === 'no_view' ? 'none' : viewType;
}

const emptyForm = {
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
  view_type: 'city_view',
  has_balcony: false,
};

function validateForm(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Title is required';
  if (!form.room_number.trim()) errors.room_number = 'Room number is required';
  if (!form.description.trim()) errors.description = 'Description is required';
  if (!form.city.trim()) errors.city = 'City is required';
  if (!form.area.trim()) errors.area = 'Area is required';
  if (!form.address.trim()) errors.address = 'Address is required';
  if (!form.price_per_night || form.price_per_night <= 0) errors.price_per_night = 'Price must be greater than 0';
  if (!form.max_guests || form.max_guests < 1) errors.max_guests = 'Max guests is required';
  return errors;
}

function buildPayload(form, isAvailable) {
  const description = form.description.trim().length >= 50
    ? form.description.trim()
    : `${form.description.trim()} Comfortable stay with thoughtful amenities and a welcoming host experience in India.`;

  return {
    room_number: form.room_number.trim(),
    title: form.title.trim(),
    description,
    room_category: form.room_category,
    bed_configuration: bedConfigForCategory(form.room_category),
    price_per_night: Number(form.price_per_night),
    max_guests: Number(form.max_guests),
    amenities: form.amenities,
    location: {
      address: form.address.trim(),
      city: form.city.trim(),
      area: form.area.trim(),
      pincode: form.pincode.trim() || undefined,
      lat: Number(form.latitude),
      lng: Number(form.longitude),
    },
    food_preference: form.food_preference,
    smoking_policy: form.smoking_policy,
    alcohol_policy: form.alcohol_policy,
    view_type: viewToApi(form.view_type),
    has_balcony: form.has_balcony,
    facing_side: 'none',
    policies: DEFAULT_POLICIES,
    is_available: isAvailable,
  };
}

function roomToForm(room) {
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
    view_type: viewFromApi(room.view_type),
    has_balcony: Boolean(room.has_balcony),
  };
}

export default function RoomForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    roomsApi.get(id)
      .then(({ data }) => setForm(roomToForm(data)))
      .catch((err) => setError(err.normalized?.message || 'Failed to load room'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const submit = async (publish) => {
    setError('');
    setSuccess('');
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(form, publish);
      if (isEdit) {
        await roomsApi.update(id, payload);
      } else {
        await roomsApi.create(payload);
      }
      setSuccess(publish ? 'Room published successfully.' : 'Draft saved successfully.');
      setTimeout(() => navigate('/host/rooms'), 1500);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading room..." />;

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <ErrorMessage message={error} />
      {success && (
        <p className="write-review-success">{success}</p>
      )}

      <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2>Basic info</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} />
            {fieldErrors.title && <span className="text-danger">{fieldErrors.title}</span>}
          </div>
          <div className="form-group">
            <label className="label">Room number</label>
            <input className="input" value={form.room_number} onChange={(e) => set('room_number', e.target.value)} />
            {fieldErrors.room_number && <span className="text-danger">{fieldErrors.room_number}</span>}
          </div>
        </div>
        <div className="form-group">
          <label className="label">Description</label>
          <textarea className="textarea" value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} />
          {fieldErrors.description && <span className="text-danger">{fieldErrors.description}</span>}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Category</label>
            <select className="select" value={form.room_category} onChange={(e) => set('room_category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Max guests</label>
            <input type="number" className="input" min={1} max={10} value={form.max_guests} onChange={(e) => set('max_guests', Number(e.target.value))} />
            {fieldErrors.max_guests && <span className="text-danger">{fieldErrors.max_guests}</span>}
          </div>
          <div className="form-group">
            <label className="label">Price per night (₹)</label>
            <input type="number" className="input" min={100} value={form.price_per_night} onChange={(e) => set('price_per_night', Number(e.target.value))} />
            {fieldErrors.price_per_night && <span className="text-danger">{fieldErrors.price_per_night}</span>}
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2>Location</h2>
        <div className="form-group">
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} />
          {fieldErrors.address && <span className="text-danger">{fieldErrors.address}</span>}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">City</label>
            <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} />
            {fieldErrors.city && <span className="text-danger">{fieldErrors.city}</span>}
          </div>
          <div className="form-group">
            <label className="label">Area</label>
            <input className="input" value={form.area} onChange={(e) => set('area', e.target.value)} />
            {fieldErrors.area && <span className="text-danger">{fieldErrors.area}</span>}
          </div>
          <div className="form-group">
            <label className="label">Pincode</label>
            <input className="input" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} inputMode="numeric" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Latitude</label>
            <input type="number" step="any" className="input" value={form.latitude} onChange={(e) => set('latitude', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="label">Longitude</label>
            <input type="number" step="any" className="input" value={form.longitude} onChange={(e) => set('longitude', Number(e.target.value))} />
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <h2>Preferences</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="label">Food preference</label>
            <select className="select" value={form.food_preference} onChange={(e) => set('food_preference', e.target.value)}>
              <option value="veg">Vegetarian</option>
              <option value="nonveg">Non-vegetarian</option>
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
              <option value="non_alcohol">Non-alcohol</option>
              <option value="alcohol">Alcohol allowed</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label">View type</label>
            <select className="select" value={form.view_type} onChange={(e) => set('view_type', e.target.value)}>
              {VIEW_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">
              <input type="checkbox" checked={form.has_balcony} onChange={(e) => set('has_balcony', e.target.checked)} />
              {' '}Has balcony
            </label>
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

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="button" className="btn btn-outline" disabled={saving} onClick={() => submit(false)}>
          {saving ? 'Saving…' : 'Save as Draft'}
        </button>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={() => submit(true)}>
          {saving ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </form>
  );
}
