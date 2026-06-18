import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ErrorMessage from '../../components/ErrorMessage';
import Spinner from '../../components/Spinner';
import { setToken, setStoredUser } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { isHostRole } from '../../utils/roles';

const DEMO_GUEST = { email: 'guest@stayease.com', password: 'demo123' };
const DEMO_HOST = { email: 'host@stayease.com', password: 'demo123' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async (creds) => {
    if (!creds.email?.trim() || !creds.password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await login(creds.email.trim(), creds.password);
      const token = localStorage.getItem('stayease_token');
      if (token) setToken(token);
      setStoredUser(user);
      navigate(isHostRole(user.role) ? '/host' : '/');
    } catch (err) {
      setError(err.normalized?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin({ email, password });
  };

  const demoLogin = (creds) => {
    setEmail(creds.email);
    setPassword(creds.password);
    doLogin(creds);
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
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline btn-sm" style={{ flex: 1 }} disabled={loading} onClick={() => demoLogin(DEMO_GUEST)}>
            Demo guest login
          </button>
          <button type="button" className="btn btn-outline btn-sm" style={{ flex: 1 }} disabled={loading} onClick={() => demoLogin(DEMO_HOST)}>
            Demo host login
          </button>
        </div>
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
      <style>{`
        .auth-page { display: flex; justify-content: center; align-items: center; min-height: 60vh; }
        .auth-card { width: 100%; max-width: 420px; padding: 2rem; }
      `}</style>
    </div>
  );
}
