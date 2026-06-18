import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import DateRangePicker from './DateRangePicker';
import LocationPicker from './LocationPicker';
import { Icon, ICON } from './ui/Icon';
import {
  buildLocationSelection,
  readLocationFromParams,
  syncSearchParams,
} from '../utils/searchState';

export default function SearchBar({ onSearch, compact = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLocation = readLocationFromParams(searchParams);
  const [where, setWhere] = useState(initialLocation.label);
  const [locationMode, setLocationMode] = useState(initialLocation.mode);
  const [coords, setCoords] = useState({ lat: initialLocation.lat, lng: initialLocation.lng });
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '2');
  const [whereActive, setWhereActive] = useState(false);

  useEffect(() => {
    const loc = readLocationFromParams(searchParams);
    setWhere(loc.label);
    setLocationMode(loc.mode);
    setCoords({ lat: loc.lat, lng: loc.lng });
    setCheckIn(searchParams.get('check_in') || '');
    setCheckOut(searchParams.get('check_out') || '');
    setGuests(searchParams.get('guests') || '2');
  }, [searchParams]);

  const syncParams = (location, dates = {}) => {
    const ci = dates.checkIn ?? checkIn;
    const co = dates.checkOut ?? checkOut;
    const g = dates.guests ?? guests;
    syncSearchParams(searchParams, setSearchParams, {
      location,
      checkIn: ci,
      checkOut: co,
      guests: g,
    });
    onSearch?.({
      where: location.label || where,
      checkIn: ci,
      checkOut: co,
      guests: g,
      nearby: location.type === 'nearby',
    });
  };

  const handleLocationSelect = (selection) => {
    if (selection.type === 'nearby') {
      const label = selection.label || 'Nearby';
      setWhere(label);
      setLocationMode('nearby');
      setCoords({ lat: selection.lat, lng: selection.lng });
      syncParams(selection);
      return;
    }
    if (selection.type === 'city') {
      setWhere(selection.label);
      setLocationMode('city');
      setCoords({ lat: '', lng: '' });
      syncParams(selection);
    }
  };

  const handleLocationQueryChange = (text) => {
    setWhere(text);
    if (locationMode === 'nearby') setLocationMode('text');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    syncParams(buildLocationSelection({ where, locationMode, coords, searchParams }));
  };

  const currentLocationSelection = () =>
    buildLocationSelection({ where, locationMode, coords, searchParams });

  const whereDisplay =
    locationMode === 'nearby' ? (where || 'Nearby') : where || 'Search destinations';

  if (compact) {
    return (
      <form className="search-pill search-pill--compact hide-mobile" onSubmit={handleSubmit}>
        <button
          type="button"
          className="search-pill__segment"
          onClick={() => document.getElementById('where-input-compact')?.focus()}
        >
          <span className="search-pill__label">Anywhere</span>
          <span className="search-pill__value">{whereDisplay}</span>
        </button>
        <span className="search-pill__divider" />
        <DateRangePicker
          variant="compact"
          start={checkIn}
          end={checkOut}
          onChange={({ start, end }) => {
            setCheckIn(start);
            setCheckOut(end);
            syncParams(currentLocationSelection(), { checkIn: start, checkOut: end });
          }}
        />
        <span className="search-pill__divider" />
        <button type="button" className="search-pill__segment">
          <span className="search-pill__label">Add guests</span>
          <span className="search-pill__value">{guests} guest{guests !== '1' ? 's' : ''}</span>
        </button>
        <button type="submit" className="search-pill__btn" aria-label="Search">
          <Icon icon={Search} size={ICON.sm} />
        </button>
      </form>
    );
  }

  return (
    <form
      className={`search-pill hide-mobile ${whereActive ? 'search-pill--where-active' : ''}`}
      onSubmit={handleSubmit}
      data-testid="search-bar"
    >
      <div className={`search-pill__segment search-pill__segment--grow search-pill__segment--where ${whereActive ? 'search-pill__segment--active' : ''}`}>
        <LocationPicker
          value={where}
          mode={locationMode}
          inputId="where-input"
          onSelect={handleLocationSelect}
          onQueryChange={handleLocationQueryChange}
          onOpenChange={setWhereActive}
        />
      </div>
      <span className="search-pill__divider" />
      <DateRangePicker
        variant="search"
        start={checkIn}
        end={checkOut}
        onChange={({ start, end }) => {
          setCheckIn(start);
          setCheckOut(end);
          syncParams(currentLocationSelection(), { checkIn: start, checkOut: end });
        }}
      />
      <span className="search-pill__divider" />
      <div className="search-pill__segment search-pill__segment--guests">
        <label className="search-pill__label" htmlFor="guests-input">Who</label>
        <input
          id="guests-input"
          type="number"
          min="1"
          max="10"
          className="search-pill__input"
          placeholder="Add guests"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
        />
      </div>
      <span className="search-pill__divider" />
      <button type="submit" className="search-pill__btn search-pill__btn--labeled" aria-label="Search">
        <Icon icon={Search} size={ICON.sm} />
        <span className="search-pill__btn-text">Search</span>
      </button>
    </form>
  );
}
