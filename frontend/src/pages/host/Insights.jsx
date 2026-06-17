import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import Spinner from '../../components/Spinner';
import { Icon, ICON } from '../../components/ui/Icon';
import { roomsApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

export default function Insights() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    roomsApi.byHost(user.id || user._id)
      .then(({ data }) => setRooms(data))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Spinner label="Loading insights..." />;

  if (rooms.length === 0) {
    return (
      <div className="host-page host-insights-empty">
        <h1>Insights</h1>
        <div className="host-insights-empty__body">
          <div className="host-empty-card__art host-empty-card__art--house" aria-hidden="true">
            <Icon icon={Building2} size={80} />
          </div>
          <h2>You don&apos;t have any listings yet</h2>
          <p>Create your first listing to get booked and access StayEase insights — occupancy, GST revenue, and guest trends.</p>
          <Link to="/host/rooms/add" className="btn btn-primary">Get started</Link>
        </div>
      </div>
    );
  }

  const live = rooms.filter((r) => r.is_available).length;
  const avgRating = rooms.reduce((s, r) => s + (r.avg_rating || 0), 0) / rooms.length;

  return (
    <div className="host-page">
      <h1>Insights</h1>
      <p className="host-page__subtitle">Listing performance across your StayEase portfolio</p>
      <div className="stat-cards">
        <div className="stat-card card">
          <div className="stat-card__label">Live listings</div>
          <div className="stat-card__value">{live}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-card__label">Total listings</div>
          <div className="stat-card__value">{rooms.length}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-card__label">Avg rating</div>
          <div className="stat-card__value">{avgRating ? avgRating.toFixed(1) : '—'}</div>
        </div>
      </div>
      <div className="host-insights-list">
        {rooms.map((room) => (
          <Link key={room._id} to={`/host/rooms/${room._id}/editor`} className="host-insights-row card">
            <div>
              <strong>{room.title}</strong>
              <p>{room.location?.city} · {room.is_available ? 'Live' : 'Draft'}</p>
            </div>
            <span>{room.avg_rating?.toFixed(1) || '—'} ★</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
