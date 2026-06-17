import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FilterBar, { apiParamsFromFilters, filtersFromParams } from '../../components/FilterBar';
import CategoryStrip from '../../components/CategoryStrip';
import RoomCard from '../../components/RoomCard';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
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

function RoomRow({ title, rooms }) {
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
            <RoomCard room={room} matchScore={room.match_score} />
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

  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.type.length || filters.food.length || filters.smoking ||
      filters.alcohol || filters.view.length || filters.balcony ||
      filters.city || filters.search || filters.nearby || filters.available ||
      filters.max_price !== '50000' || filters.sort,
    );
  }, [filters]);

  const fetchRooms = async () => {
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
    fetchRooms();
  }, [searchParams]);

  useEffect(() => {
    if (authLoading || user) return;
    if (isWelcomeOfferDismissed()) return;
    const timer = window.setTimeout(() => setShowWelcomeOffer(true), 1200);
    return () => window.clearTimeout(timer);
  }, [authLoading, user, isWelcomeOfferDismissed]);

  const handleCloseWelcomeOffer = () => {
    dismissWelcomeOffer();
    setShowWelcomeOffer(false);
  };

  const cityGroups = useMemo(() => groupByCity(rooms), [rooms]);

  return (
    <div className="home-page">
      <WelcomeOfferModal open={showWelcomeOffer} onClose={handleCloseWelcomeOffer} />
      <div className="home-chrome">
        <div className="search-strips">
          <CategoryStrip />
        </div>
        <FilterBar defaultExpanded={false} />
      </div>

      {loading && <Spinner label="Loading rooms..." />}
      {error && <ErrorMessage message={error.message} isNetwork={error.isNetwork} onRetry={fetchRooms} />}

      {!loading && !error && (
        <>
          {rooms.length === 0 ? (
            <div className="empty-state">
              <p>No rooms match your filters.</p>
              <p className="empty-state__hint">Try adjusting filters or search a different destination.</p>
            </div>
          ) : hasActiveFilters ? (
            <section>
              <h2 className="home-results__title">
                {filters.nearby
                  ? `${rooms.length} stay${rooms.length !== 1 ? 's' : ''} near you`
                  : filters.city && filters.type.length === 1
                  ? `${rooms.length} ${filters.type[0]} stay${rooms.length !== 1 ? 's' : ''} in ${filters.city}`
                  : filters.city
                    ? `${rooms.length} stay${rooms.length !== 1 ? 's' : ''} in ${filters.city}`
                    : filters.type.length === 1
                      ? `${rooms.length} ${filters.type[0]} stay${rooms.length !== 1 ? 's' : ''}`
                      : `${rooms.length} stay${rooms.length !== 1 ? 's' : ''} found`}
              </h2>
              <div className="grid-rooms">
                {rooms.map((room) => (
                  <RoomCard key={room._id} room={room} matchScore={room.match_score} />
                ))}
              </div>
            </section>
          ) : (
            <div className="home-sections">
              {cityGroups.map(([city, cityRooms]) => (
                <RoomRow
                  key={city}
                  title={`Stay in ${city}`}
                  rooms={cityRooms}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
