import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FilterBar, { apiParamsFromFilters, filtersFromParams } from '../../components/FilterBar';
import CategoryStrip from '../../components/CategoryStrip';
import RoomCard from '../../components/RoomCard';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import OfferBanner from '../../components/OfferBanner';
import CompareRoomsModal from '../../components/CompareRoomsModal';
import WelcomeOfferModal from '../../components/onboarding/WelcomeOfferModal';
import { useAuth } from '../../context/AuthContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { roomsApi } from '../../api/api';

function groupByCity(rooms) {
  const groups = {};
  for (const room of rooms) {
    const city = room.location?.city || 'Other';
    if (!groups[city]) groups[city] = [];
    groups[city].push(room);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

function RoomRow({ title, rooms, compareIds, onCompareToggle }) {
  const scroll = (dir) => {
    const el = document.getElementById(`row-${title.replace(/\s/g, '-')}`);
    if (el) el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <section className="room-row">
      <div className="room-row__header">
        <h2 className="room-row__title">{title}</h2>
        <div className="room-row__nav hide-mobile">
          <button type="button" onClick={() => scroll(-1)} aria-label="Scroll left">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Scroll right">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="room-row__scroll" id={`row-${title.replace(/\s/g, '-')}`}>
        {rooms.map((room) => (
          <div key={room._id} className="room-row__item">
            <RoomCard
              room={room}
              matchScore={room.match_score}
              compareMode
              compareSelected={compareIds.includes(room._id || room.id)}
              onCompareToggle={onCompareToggle}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { isWelcomeOfferDismissed, dismissWelcomeOffer } = useOnboarding();
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWelcomeOffer, setShowWelcomeOffer] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.type.length || filters.food.length || filters.smoking ||
      filters.alcohol || filters.view.length || filters.balcony ||
      filters.city || filters.search || filters.nearby || filters.available ||
      filters.max_price !== '50000' || filters.sort ||
      searchParams.get('check_in') || searchParams.get('guests'),
    );
  }, [filters, searchParams]);

  const loadRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = apiParamsFromFilters(filters);
      const { data } = await roomsApi.list(params);
      setRooms(data);
    } catch (err) {
      setError(err.normalized || { message: 'Failed to load rooms' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [searchParams]);

  useEffect(() => {
    if (authLoading || user) return;
    if (isWelcomeOfferDismissed()) return;
    const timer = window.setTimeout(() => setShowWelcomeOffer(true), 1200);
    return () => window.clearTimeout(timer);
  }, [authLoading, user, isWelcomeOfferDismissed]);

  const handleCompareToggle = (roomId) => {
    setCompareIds((prev) => {
      if (prev.includes(roomId)) return prev.filter((id) => id !== roomId);
      if (prev.length >= 3) return prev;
      return [...prev, roomId];
    });
  };

  const compareRooms = rooms.filter((r) => compareIds.includes(r._id || r.id));

  return (
    <div className="home-page">
      <WelcomeOfferModal open={showWelcomeOffer} onClose={() => { dismissWelcomeOffer(); setShowWelcomeOffer(false); }} />
      <OfferBanner />
      <div className="home-chrome" style={{ padding: '0 1rem 1rem' }}>
        <div className="search-strips">
          <CategoryStrip />
        </div>
        <FilterBar defaultExpanded={hasActiveFilters} />
      </div>

      {loading && <Spinner label="Loading rooms..." />}
      {error && <ErrorMessage message={error.message} isNetwork={error.isNetwork} onRetry={loadRooms} />}

      {!loading && !error && (
        <>
          {rooms.length === 0 ? (
            <div className="empty-state">
              <p>No rooms match your filters.</p>
            </div>
          ) : hasActiveFilters ? (
            <section style={{ padding: '0 1rem' }}>
              <h2 className="home-results__title">{rooms.length} room{rooms.length !== 1 ? 's' : ''} found</h2>
              <div className="grid-rooms">
                {rooms.map((room) => (
                  <RoomCard
                    key={room._id}
                    room={room}
                    matchScore={room.match_score}
                    compareMode
                    compareSelected={compareIds.includes(room._id || room.id)}
                    onCompareToggle={handleCompareToggle}
                  />
                ))}
              </div>
            </section>
          ) : (
            <div className="home-sections">
              {groupByCity(rooms).map(([city, cityRooms]) => (
                <RoomRow
                  key={city}
                  title={`Stay in ${city}`}
                  rooms={cityRooms}
                  compareIds={compareIds}
                  onCompareToggle={handleCompareToggle}
                />
              ))}
            </div>
          )}
        </>
      )}

      {compareIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 72,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 999,
          padding: '0.75rem 1.25rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
        }}
        >
          <span>Compare ({compareIds.length})</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setCompareOpen(true)}>
            View comparison
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCompareIds([])}>Clear</button>
        </div>
      )}

      <CompareRoomsModal open={compareOpen} onClose={() => setCompareOpen(false)} rooms={compareRooms} />
    </div>
  );
}
