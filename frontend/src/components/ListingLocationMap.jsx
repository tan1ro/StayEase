import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Icon, ICON } from './ui/Icon';
import { buildOpenStreetMapEmbedUrl, getMockListingCoordinates } from '../utils/mockMapLocation';

export default function ListingLocationMap({ room, roomId }) {
  const location = room?.location || {};
  const coords = useMemo(
    () => getMockListingCoordinates(roomId, location),
    [roomId, location.lat, location.lng, location.city],
  );
  const mapUrl = useMemo(
    () => buildOpenStreetMapEmbedUrl(coords.lat, coords.lng),
    [coords.lat, coords.lng],
  );
  const areaLabel = [location.area, location.city].filter(Boolean).join(', ') || location.city || 'Approximate area';

  return (
    <div className="listing-map listing-map--embed">
      <div className="listing-map__pin">
        <Icon icon={MapPin} size={ICON.sm} />
        <span>{areaLabel}</span>
      </div>
      <iframe
        title={`Map near ${areaLabel}`}
        src={mapUrl}
        className="listing-map__frame"
        loading="lazy"
      />
    </div>
  );
}
