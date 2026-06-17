export default function Spinner({ size = 32, label = 'Loading...' }) {
  return (
    <div className="spinner-wrap" role="status" aria-label={label}>
      <div
        className="spinner"
        style={{ width: size, height: size, borderWidth: Math.max(2, size / 10) }}
      />
      {label && <span className="spinner-label">{label}</span>}
      <style>{`
        .spinner-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 2rem;
        }
        .spinner {
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .spinner-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
