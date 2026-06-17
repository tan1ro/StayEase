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
      <style>{`
        .attraction-card { padding: 1rem; }
        .attraction-card h4 { margin-bottom: 0.25rem; }
        .attraction-card__category {
          font-size: 0.75rem;
          color: var(--primary);
          font-weight: 600;
          text-transform: uppercase;
        }
        .attraction-card__desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 0.5rem 0;
        }
        .attraction-card__meta {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
