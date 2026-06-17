import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoomCard from '../../components/RoomCard';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import { roomsApi } from '../../api/api';

const STEPS = ['Preferences', 'Budget & Location', 'Results'];

export default function FindMyRoom() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState({
    food_preference: '',
    smoking_policy: '',
    alcohol_policy: '',
    view_type: '',
    room_category: '',
    balcony: null,
    max_price: 10000,
    city: 'Bangalore',
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = Object.fromEntries(
        Object.entries(prefs).filter(([, v]) => v !== '' && v != null),
      );
      const { data } = await roomsApi.recommend(payload);
      setResults(data);
      setStep(2);
    } catch (err) {
      setError(err.normalized?.message || 'Recommendation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="find-room">
      <h1 className="page-title">Find My Room</h1>
      <p className="page-subtitle">Answer a few questions and we&apos;ll find your perfect match.</p>
      <div className="tabs">
        {STEPS.map((s, i) => (
          <button key={s} type="button" className={`tab ${step === i ? 'tab--active' : ''}`}>
            {i + 1}. {s}
          </button>
        ))}
      </div>
      <ErrorMessage message={error} />
      {step === 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="form-group">
            <label className="label">Food preference</label>
            <select className="select" value={prefs.food_preference} onChange={(e) => setPrefs({ ...prefs, food_preference: e.target.value })}>
              <option value="">Any</option>
              <option value="veg">Veg Only</option>
              <option value="nonveg">Non-Veg</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Smoking policy</label>
            <select className="select" value={prefs.smoking_policy} onChange={(e) => setPrefs({ ...prefs, smoking_policy: e.target.value })}>
              <option value="">Any</option>
              <option value="non_smoking">Non-Smoking</option>
              <option value="smoking">Smoking</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Alcohol policy</label>
            <select className="select" value={prefs.alcohol_policy} onChange={(e) => setPrefs({ ...prefs, alcohol_policy: e.target.value })}>
              <option value="">Any</option>
              <option value="non_alcohol">No Alcohol</option>
              <option value="alcohol">Alcohol OK</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">View type</label>
            <select className="select" value={prefs.view_type} onChange={(e) => setPrefs({ ...prefs, view_type: e.target.value })}>
              <option value="">Any</option>
              <option value="hill_view">Hill View</option>
              <option value="beach_view">Beach View</option>
              <option value="city_view">City View</option>
            </select>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setStep(1)}>Next</button>
        </div>
      )}
      {step === 1 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="form-group">
            <label className="label">City</label>
            <input className="input" value={prefs.city} onChange={(e) => setPrefs({ ...prefs, city: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Max price per night: ₹{prefs.max_price}</label>
            <input type="range" min="500" max="50000" step="500" value={prefs.max_price} onChange={(e) => setPrefs({ ...prefs, max_price: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="label">Room category</label>
            <select className="select" value={prefs.room_category} onChange={(e) => setPrefs({ ...prefs, room_category: e.target.value })}>
              <option value="">Any</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Suite">Suite</option>
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={prefs.balcony === true} onChange={(e) => setPrefs({ ...prefs, balcony: e.target.checked ? true : null })} />
            Prefer balcony
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setStep(0)}>Back</button>
            <button type="button" className="btn btn-primary" onClick={submit} disabled={loading}>
              {loading ? 'Finding...' : 'Find Rooms'}
            </button>
          </div>
        </div>
      )}
      {step === 2 && (
        <>
          {loading ? <Spinner /> : (
            <div className="grid-rooms">
              {results.map((room) => (
                <RoomCard key={room._id} room={room} matchScore={room.match_score} />
              ))}
            </div>
          )}
          {results.length === 0 && !loading && (
            <div className="empty-state">
              <p>No matches found.</p>
              <button type="button" className="btn btn-primary" onClick={() => setStep(0)}>Start over</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
