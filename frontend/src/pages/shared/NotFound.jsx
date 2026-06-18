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
    </div>
  );
}
