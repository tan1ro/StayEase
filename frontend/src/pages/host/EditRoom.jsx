import { useParams } from 'react-router-dom';
import RoomForm from './RoomForm';

export default function EditRoom() {
  const { id } = useParams();

  return (
    <div className="host-page">
      <h1 className="page-title">{id ? 'Edit Room' : 'Add Room'}</h1>
      <RoomForm />
    </div>
  );
}
