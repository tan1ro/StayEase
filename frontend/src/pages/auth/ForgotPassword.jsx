import { useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorMessage from '../../components/ErrorMessage';
import Spinner from '../../components/Spinner';
import { authApi } from '../../api/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmed = email.trim();
    const nextFieldErrors = {};
    if (!trimmed) {
      nextFieldErrors.email = 'Email is required';
    } else if (!EMAIL_RE.test(trimmed)) {
      nextFieldErrors.email = 'Enter a valid email address';
    }

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setError('Please enter a valid email address');
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const { data } = await authApi.forgotPassword(trimmed);
      setSuccess(data.message || 'If an account exists for this email, password reset instructions have been sent.');
    } catch (err) {
      if (err.normalized?.fields?.email) {
        setFieldErrors({ email: err.normalized.fields.email });
      }
      setError(err.normalized?.message || 'Could not send reset instructions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1>Forgot password?</h1>
        <p className="page-subtitle">
          Enter the email linked to your StayEase account and we&apos;ll send reset instructions.
        </p>

        {success ? (
          <div className="auth-card__success" role="status">
            <p>{success}</p>
            <Link to="/login" className="btn btn-primary auth-card__submit">Back to log in</Link>
          </div>
        ) : (
          <>
            <ErrorMessage message={error} />
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="label" htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  className={`input${fieldErrors.email ? ' input--error' : ''}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors({});
                    if (error) setError('');
                  }}
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'forgot-email-error' : undefined}
                />
                {fieldErrors.email && (
                  <span id="forgot-email-error" className="field-error" role="alert">{fieldErrors.email}</span>
                )}
              </div>
              {loading ? <Spinner size={24} label="" /> : (
                <button type="submit" className="btn btn-primary auth-card__submit">Send reset link</button>
              )}
            </form>
          </>
        )}

        {!success && (
          <p className="auth-card__footer">
            Remember your password? <Link to="/login">Log in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
