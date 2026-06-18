import { useEffect, useId, useRef, useState } from 'react';
import {
  Building2,
  Landmark,
  Mountain,
  Navigation,
  Palmtree,
  Search,
  Trees,
} from 'lucide-react';
import { SEARCH_LOCATIONS } from '../constants/searchLocations';
import { requestUserLocation } from '../utils/geo';

const ICON_MAP = {
  city: Building2,
  beach: Palmtree,
  hill: Mountain,
  landmark: Landmark,
  nature: Trees,
};

function DestinationIcon({ type }) {
  const Icon = ICON_MAP[type] || Building2;
  return (
    <span className={`location-dropdown__icon location-dropdown__icon--${type}`}>
      <Icon size={22} strokeWidth={1.75} />
    </span>
  );
}

export default function LocationPicker({
  value = '',
  mode = 'text',
  onSelect,
  onQueryChange,
  onOpenChange,
  compact = false,
  variant = 'dropdown',
  inputId = 'where-input',
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    if (mode === 'nearby') setQuery(value || 'Nearby');
    else setQuery(value);
  }, [value, mode]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const filtered = SEARCH_LOCATIONS.filter((loc) => {
    const q = query.trim().toLowerCase();
    if (!q || mode === 'nearby') return true;
    return (
      loc.label.toLowerCase().includes(q) ||
      loc.value.toLowerCase().includes(q) ||
      loc.subtitle.toLowerCase().includes(q)
    );
  });

  const handleFocus = () => {
    setOpen(true);
    setGeoError('');
    if (mode === 'nearby') {
      setQuery('');
      onQueryChange?.('');
    }
  };

  const handleChange = (e) => {
    const next = e.target.value;
    setQuery(next);
    setGeoError('');
    onQueryChange?.(next);
    if (!open) setOpen(true);
  };

  const selectCity = (loc) => {
    setQuery(loc.label);
    setOpen(false);
    setGeoError('');
    onSelect?.({ type: 'city', city: loc.value, label: loc.label });
  };

  const selectNearPlace = (loc) => {
    if (loc.lat == null || loc.lng == null) {
      selectCity(loc);
      return;
    }
    const label = `Near ${loc.value}`;
    setQuery(label);
    setOpen(false);
    setGeoError('');
    onSelect?.({ type: 'nearby', lat: loc.lat, lng: loc.lng, label, place: loc.value });
  };

  const handleNearby = async () => {
    setLocating(true);
    setGeoError('');
    try {
      const { lat, lng } = await requestUserLocation();
      setQuery('Nearby');
      setOpen(false);
      onSelect?.({ type: 'nearby', lat, lng, label: 'Nearby' });
    } catch (err) {
      setGeoError(err.message || 'Could not get your location');
    } finally {
      setLocating(false);
    }
  };

  const displayValue = mode === 'nearby' && !open && variant !== 'modal' ? (value || 'Nearby') : query;

  const listContent = (
    <>
      <button
        type="button"
        className="location-dropdown__item location-dropdown__item--nearby"
        onClick={handleNearby}
        disabled={locating}
      >
        <span className="location-dropdown__nearby-icon">
          <Navigation size={20} strokeWidth={2} />
        </span>
        <span className="location-dropdown__text">
          <strong>{locating ? 'Finding your location…' : 'Nearby'}</strong>
          <span>Find what&apos;s around you</span>
        </span>
      </button>
      {geoError && <p className="location-dropdown__error" role="alert">{geoError}</p>}
      <p className="location-dropdown__heading">Suggested destinations</p>
      <div className="location-dropdown__list">
        {filtered.length === 0 ? (
          <p className="location-dropdown__empty">No destinations match your search</p>
        ) : (
          filtered.map((loc) => (
            <div key={loc.value} className="location-dropdown__row">
              <button
                type="button"
                className="location-dropdown__item"
                onClick={() => selectCity(loc)}
              >
                <DestinationIcon type={loc.icon} />
                <span className="location-dropdown__text">
                  <strong>{loc.label}</strong>
                  <span>{loc.subtitle}</span>
                </span>
              </button>
              {loc.lat != null && loc.lng != null && (
                <button
                  type="button"
                  className="location-dropdown__near-btn"
                  onClick={() => selectNearPlace(loc)}
                  aria-label={`Near ${loc.value}`}
                >
                  Near
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );

  if (variant === 'modal') {
    return (
      <div className="location-picker location-picker--modal">
        <div className="mobile-search-input-wrap">
          <Search className="mobile-search-input-wrap__icon" size={18} />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            className="mobile-search-input"
            placeholder="Search by city or landmark"
            value={displayValue}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>
        <div className="location-dropdown location-dropdown--modal" role="listbox">
          {listContent}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`location-picker ${open ? 'location-picker--open' : ''} ${compact ? 'location-picker--compact' : ''}`}
      ref={rootRef}
    >
      <label className="search-pill__label" htmlFor={inputId}>
        {compact ? 'Anywhere' : 'Where'}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        className="search-pill__input"
        placeholder="Search by city or landmark"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listId}
        role="combobox"
      />
      {open && (
        <div className="location-dropdown" id={listId} role="listbox">
          {listContent}
        </div>
      )}
    </div>
  );
}
