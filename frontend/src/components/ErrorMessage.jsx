import { AlertCircle, WifiOff } from 'lucide-react';

export default function ErrorMessage({ message, onRetry, isNetwork }) {
  if (!message) return null;

  return (
    <div className="error-message" role="alert">
      {isNetwork ? <WifiOff size={20} /> : <AlertCircle size={20} />}
      <div>
        <p className="error-message__text">{message}</p>
        {onRetry && (
          <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
      <style>{`
        .error-message {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: rgba(255, 56, 92, 0.08);
          border: 1px solid var(--danger);
          border-radius: var(--radius-input);
          color: var(--danger);
          margin: 1rem 0;
        }
        .error-message__text {
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
