import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Minus, Plus, Search, X } from 'lucide-react';
import DateRangePicker from './DateRangePicker';
import LocationPicker from './LocationPicker';
import {
  buildLocationSelection,
  readLocationFromParams,
  syncSearchParams,
} from '../utils/searchState';
import { formatRangeLabel } from '../utils/dates';

export default function MobileSearchModal({ open, onClose }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = readLocationFromParams(searchParams);
  const [activeSection, setActiveSection] = useState('where');
  const [where, setWhere] = useState(initial.label);
  const [locationMode, setLocationMode] = useState(initial.mode);
  const [coords, setCoords] = useState({ lat: initial.lat, lng: initial.lng });
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests') || 2));

  useEffect(() => {
    if (!open) return undefined;
    const loc = readLocationFromParams(searchParams);
    setWhere(loc.label);
    setLocationMode(loc.mode);
    setCoords({ lat: loc.lat, lng: loc.lng });
    setCheckIn(searchParams.get('check_in') || '');
    setCheckOut(searchParams.get('check_out') || '');
    setGuests(Number(searchParams.get('guests') || 2));
    setActiveSection('where');
    document.body.classList.add('mobile-search-open');
    return () => document.body.classList.remove('mobile-search-open');
  }, [open, searchParams]);

  if (!open) return null;

  const whereSummary =
    locationMode === 'nearby' ? 'Nearby' : where || 'Search destinations';
  const whenSummary = formatRangeLabel(checkIn, checkOut);
  const whoSummary = `${guests} guest${guests !== 1 ? 's' : ''}`;

  const applySearch = () => {
    const location = buildLocationSelection({ where, locationMode, coords, searchParams });
    syncSearchParams(searchParams, setSearchParams, {
      location,
      checkIn,
      checkOut,
      guests: String(guests),
    });
    onClose();
  };

  const clearAll = () => {
    setWhere('');
    setLocationMode('text');
    setCoords({ lat: '', lng: '' });
    setCheckIn('');
    setCheckOut('');
    setGuests(2);
    setSearchParams(new URLSearchParams());
    setActiveSection('where');
  };

  const handleLocationSelect = (selection) => {
    if (selection.type === 'nearby') {
      setWhere('Nearby');
      setLocationMode('nearby');
      setCoords({ lat: selection.lat, lng: selection.lng });
      setActiveSection('when');
      return;
    }
    if (selection.type === 'city') {
      setWhere(selection.label);
      setLocationMode('city');
      setCoords({ lat: '', lng: '' });
      setActiveSection('when');
    }
  };

  return (
    <div className="mobile-search-modal" role="dialog" aria-modal="true" aria-label="Search stays">
      <div className="mobile-search-modal__backdrop" onClick={onClose} aria-hidden />
      <div className="mobile-search-modal__panel">
        <header className="mobile-search-modal__header">
          <button type="button" className="mobile-search-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="mobile-search-modal__sections">
          <section className={`mobile-search-section${activeSection === 'where' ? ' mobile-search-section--open' : ''}`}>
            <button type="button" className="mobile-search-section__trigger" onClick={() => setActiveSection('where')}>
              <span className="mobile-search-section__label">Where?</span>
              {activeSection !== 'where' && (
                <span className="mobile-search-section__value">{whereSummary}</span>
              )}
            </button>
            {activeSection === 'where' && (
              <div className="mobile-search-section__body">
                <LocationPicker
                  variant="modal"
                  value={where}
                  mode={locationMode}
                  inputId="mobile-where-input"
                  onSelect={handleLocationSelect}
                  onQueryChange={(text) => {
                    setWhere(text);
                    if (locationMode === 'nearby') setLocationMode('text');
                  }}
                />
              </div>
            )}
          </section>

          <section className={`mobile-search-section${activeSection === 'when' ? ' mobile-search-section--open' : ''}`}>
            <button type="button" className="mobile-search-section__trigger" onClick={() => setActiveSection('when')}>
              <span className="mobile-search-section__label">When</span>
              {activeSection !== 'when' && (
                <span className="mobile-search-section__value">{whenSummary}</span>
              )}
            </button>
            {activeSection === 'when' && (
              <div className="mobile-search-section__body mobile-search-section__body--dates">
                <DateRangePicker
                  variant="input"
                  start={checkIn}
                  end={checkOut}
                  onChange={({ start, end }) => {
                    setCheckIn(start);
                    setCheckOut(end);
                    if (start && end) setActiveSection('who');
                  }}
                />
              </div>
            )}
          </section>

          <section className={`mobile-search-section${activeSection === 'who' ? ' mobile-search-section--open' : ''}`}>
            <button type="button" className="mobile-search-section__trigger" onClick={() => setActiveSection('who')}>
              <span className="mobile-search-section__label">Who</span>
              {activeSection !== 'who' && (
                <span className="mobile-search-section__value">{whoSummary}</span>
              )}
            </button>
            {activeSection === 'who' && (
              <div className="mobile-search-section__body">
                <div className="guest-stepper">
                  <div>
                    <strong>Guests</strong>
                    <p>Ages 13 or above</p>
                  </div>
                  <div className="guest-stepper__controls">
                    <button
                      type="button"
                      className="guest-stepper__btn"
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      disabled={guests <= 1}
                      aria-label="Decrease guests"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="guest-stepper__count">{guests}</span>
                    <button
                      type="button"
                      className="guest-stepper__btn"
                      onClick={() => setGuests((g) => Math.min(10, g + 1))}
                      disabled={guests >= 10}
                      aria-label="Increase guests"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="mobile-search-modal__footer">
          <button type="button" className="mobile-search-modal__clear" onClick={clearAll}>
            Clear all
          </button>
          <button type="button" className="mobile-search-modal__submit" onClick={applySearch}>
            <Search size={18} />
            Search
          </button>
        </footer>
      </div>
    </div>
  );
}
