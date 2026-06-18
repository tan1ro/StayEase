import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import RoomDetail from '../guest/RoomDetail';
import { Icon, ICON } from '../../components/ui/Icon';

export default function ViewYourSpace() {
  const { id } = useParams();

  return (
    <div className="host-view-space">
      <header className="host-view-space__bar">
        <Link to={`/host/rooms/${id}/editor`} className="host-view-space__back">
          <Icon icon={ArrowLeft} size={ICON.md} />
          <span>Listing editor</span>
        </Link>
        <h1 className="host-view-space__title">View your space</h1>
        <Link to={`/host/rooms/${id}/editor`} className="host-view-space__edit">
          <Icon icon={Pencil} size={ICON.sm} />
          Edit listing
        </Link>
      </header>
      <div className="host-view-space__preview">
        <RoomDetail hostPreview />
      </div>
    </div>
  );
}
