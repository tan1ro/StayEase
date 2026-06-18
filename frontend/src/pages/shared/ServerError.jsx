import { Link } from 'react-router-dom';
import { RefreshCw, WifiOff } from 'lucide-react';

export default function ServerError({ message, onRetry }) {
  return (
    <div className="error-page">
      <WifiOff size={48} color="var(--danger)" />
      <h1>Something went wrong</h1>
      <p>{message || 'A server or network error occurred. Please try again later.'}</p>
      <div className="error-page__actions">
        {onRetry && (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            <RefreshCw size={16} /> Try Again
          </button>
        )}
        <Link to="/" className="btn btn-outline">Go Home</Link>
      </div>
    </div>
  );
}
