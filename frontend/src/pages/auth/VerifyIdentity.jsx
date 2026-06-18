import IdentityVerification from '../../components/IdentityVerification';
import { useAuth } from '../../context/AuthContext';

export default function VerifyIdentity() {
  const { user, refreshUser } = useAuth();

  return (
    <div className="auth-page auth-page--verify">
      <div className="auth-card">
        <h1 className="page-title">Verify Identity</h1>
        <p className="page-subtitle">Upload a government-issued ID to verify your account.</p>
        <div className="card" style={{ padding: '1.5rem' }}>
          <IdentityVerification verified={user?.email_verified} onSuccess={refreshUser} />
        </div>
      </div>
    </div>
  );
}
