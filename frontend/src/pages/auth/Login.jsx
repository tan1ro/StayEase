import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ErrorMessage from '../../components/ErrorMessage';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import { defaultRouteForUser } from '../../utils/roles';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      navigate(defaultRouteForUser(user));
    } catch (err) {
      setError(err.normalized?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Welcome back</h1>
        <p className="page-subtitle">Log in to your StayEase account</p>
        <ErrorMessage message={error} />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {loading ? <Spinner size={24} label="" /> : (
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Log in</button>
          )}
        </form>
        <p className="login-demo-hint">
          Demo host: <code>host@stayease.com</code> / <code>Host@1234</code>
          <br />
          Demo tourist: <code>tourist@stayease.com</code> / <code>Guest@1234</code>
        </p>
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
      <style>{`
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          padding: 2rem;
        }
        .login-demo-hint {
          margin-top: 1rem;
          text-align: center;
          font-size: 0.82rem;
          color: var(--text-secondary);
        }
        .login-demo-hint code {
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}
