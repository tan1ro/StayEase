import { MapPin } from 'lucide-react';

export default function AttractionCard({ attraction }) {
  return (
    <div className="attraction-card card">
      <h4>{attraction.name}</h4>
      <span className="attraction-card__category">{attraction.category}</span>
      <p className="attraction-card__desc">{attraction.description}</p>
      <div className="attraction-card__meta">
        <MapPin size={14} />
        <span>{attraction.distance_km} km away</span>
        {attraction.open_hours && <span> · {attraction.open_hours}</span>}
      </div>
    </div>
  );
}
