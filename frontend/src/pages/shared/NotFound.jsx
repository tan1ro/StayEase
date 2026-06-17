import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="error-page">
      <h1>404</h1>
      <p>Page not found</p>
      <div className="error-page__actions">
        <Link to="/" className="btn btn-primary"><Home size={16} /> Go Home</Link>
        <Link to="/" className="btn btn-outline"><Search size={16} /> Browse Rooms</Link>
      </div>
      <style>{`
        .error-page {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 0.75rem;
        }
        .error-page h1 { font-size: 4rem; color: var(--primary); }
        .error-page__actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
      `}</style>
    </div>
  );
}
