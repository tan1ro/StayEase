import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ErrorMessage from '../../components/ErrorMessage';
import OAuthButtons from '../../components/OAuthButtons';
import Spinner from '../../components/Spinner';
import { setToken, setStoredUser } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { userNeedsPhone } from '../../utils/auth';
import { isHostRole, normalizeRole } from '../../utils/roles';

const DEMO_GUEST = { email: 'guest@stayease.com', password: 'demo123' };
const DEMO_HOST = { email: 'host@stayease.com', password: 'demo123' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin({ email, password }) {
  const fieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    fieldErrors.email = 'Email is required';
  } else if (!EMAIL_RE.test(trimmedEmail)) {
    fieldErrors.email = 'Enter a valid email address';
  }

  if (!password) {
    fieldErrors.password = 'Password is required';
  } else if (password.length < 6) {
    fieldErrors.password = 'Password must be at least 6 characters';
  }

  return fieldErrors;
}

export default function Login() {
  const { login, setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const doLogin = async (creds) => {
    const nextFieldErrors = validateLogin(creds);
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setError('Please fix the highlighted fields');
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      const user = await login(creds.email.trim(), creds.password);
      const token = localStorage.getItem('stayease_token');
      if (token) setToken(token);
      setStoredUser(user);
      navigate(isHostRole(user.role) ? '/host' : '/');
    } catch (err) {
      if (err.normalized?.fields && Object.keys(err.normalized.fields).length) {
        setFieldErrors(err.normalized.fields);
        setError('Please fix the highlighted fields');
      } else if (err.normalized?.status === 401) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(err.normalized?.message || 'Login failed');
      }
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
    setFieldErrors({});
    setError('');
    doLogin(creds);
  };

  const handleOAuthSuccess = (data) => {
    setToken(data.access_token);
    const normalizedUser = { ...data.user, role: normalizeRole(data.user.role) };
    setStoredUser(normalizedUser);
    setUser(normalizedUser);
    setError('');

    if (data.needs_phone || userNeedsPhone(data.user)) {
      navigate('/register?step=profile');
      return;
    }

    navigate(isHostRole(data.user.role) ? '/host' : '/');
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Welcome back</h1>
        <p className="page-subtitle">Log in to your StayEase account</p>
        <ErrorMessage message={error} />
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className={`input${fieldErrors.email ? ' input--error' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
                if (error) setError('');
              }}
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
            />
            {fieldErrors.email && (
              <span id="login-email-error" className="field-error" role="alert">{fieldErrors.email}</span>
            )}
          </div>
          <div className="form-group">
            <div className="auth-card__label-row">
              <label className="label" htmlFor="login-password">Password</label>
              <Link to="/forgot-password" className="auth-card__link">Forgot password?</Link>
            </div>
            <input
              id="login-password"
              type="password"
              className={`input${fieldErrors.password ? ' input--error' : ''}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
                if (error) setError('');
              }}
              autoComplete="current-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
            />
            {fieldErrors.password && (
              <span id="login-password-error" className="field-error" role="alert">{fieldErrors.password}</span>
            )}
          </div>
          {loading ? <Spinner size={24} label="" /> : (
            <button type="submit" className="btn btn-primary auth-card__submit">Log in</button>
          )}
        </form>
        <OAuthButtons disabled={loading} onSuccess={handleOAuthSuccess} onError={setError} />
        <div className="auth-card__demo-row">
          <button type="button" className="btn btn-outline btn-sm" disabled={loading} onClick={() => demoLogin(DEMO_GUEST)}>
            Demo guest login
          </button>
          <button type="button" className="btn btn-outline btn-sm" disabled={loading} onClick={() => demoLogin(DEMO_HOST)}>
            Demo host login
          </button>
        </div>
        <p className="auth-card__footer">
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
