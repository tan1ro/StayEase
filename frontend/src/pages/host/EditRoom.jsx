import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import ErrorMessage from '../../components/ErrorMessage';
import RoomForm from './RoomForm';
import { roomsApi } from '../../api/api';

export default function EditRoom() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    roomsApi.get(id)
      .then(({ data }) => setRoom(data))
      .catch((err) => setError(err.normalized?.message || 'Room not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!room) return null;

  return (
    <div>
      <h1 className="page-title">Edit Room</h1>
      <RoomForm initial={room} roomId={id} isEdit />
    </div>
  );
}
