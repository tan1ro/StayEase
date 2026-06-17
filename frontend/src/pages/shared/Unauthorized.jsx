import { Link } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="error-page">
      <Lock size={48} color="var(--warning)" />
      <h1>Access Denied</h1>
      <p>You don&apos;t have permission to view this page.</p>
      <div className="error-page__actions">
        <Link to="/login" className="btn btn-primary"><LogIn size={16} /> Log in</Link>
        <Link to="/" className="btn btn-outline">Go Home</Link>
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
        .error-page__actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
      `}</style>
    </div>
  );
}
