import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import RoomCard from '../../components/RoomCard';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import { Icon, ICON } from '../../components/ui/Icon';
import { wishlistApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

export default function Wishlist() {
  const { user, refreshUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await wishlistApi.list();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.normalized?.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleWishlistToggle = async (roomId) => {
    setRooms((prev) => prev.filter((r) => (r._id || r.id) !== roomId));
    await refreshUser();
  };

  if (loading) {
    return (
      <div className="page">
        <Spinner label="Loading wishlist..." />
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Wishlist</h1>
      <ErrorMessage message={error} onRetry={load} />
      {rooms.length === 0 ? (
        <div className="empty-state empty-state--fill">
          <Icon icon={Heart} size={ICON.xl} />
          <p>No saved rooms yet. Explore rooms →</p>
          <Link to="/" className="btn btn-primary">Explore rooms</Link>
        </div>
      ) : (
        <div className="grid-rooms">
          {rooms.map((room) => (
            <RoomCard
              key={room._id || room.id}
              room={room}
              onWishlistToggle={handleWishlistToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
