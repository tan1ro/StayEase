import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import ErrorMessage from '../../components/ErrorMessage';
import Spinner from '../../components/Spinner';
import CommunityCommitmentModal from '../../components/onboarding/CommunityCommitmentModal';
import { useAuth } from '../../context/AuthContext';
import { defaultRouteForUser, detectRegistrationRole } from '../../utils/roles';

const STEPS = ['account', 'profile', 'community'];

function isAdult(dob) {
  if (!dob) return false;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 18;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(STEPS[0]);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    referred_by: searchParams.get('ref') || '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const goBack = () => {
    setError('');
    if (step === STEPS[1]) setStep(STEPS[0]);
    else navigate('/login');
  };

  const handleAccountContinue = (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setStep(STEPS[1]);
  };

  const handleProfileContinue = (e) => {
    e.preventDefault();
    setError('');
    if (!isAdult(form.dateOfBirth)) {
      setError('You must be at least 18 years old to sign up');
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setError('Phone must be a 10-digit number');
      return;
    }
    setStep(STEPS[2]);
  };

  const submitRegistration = async () => {
    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      const user = await register({
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
        role: detectRegistrationRole(form.email, { asHost: searchParams.get('as') === 'host' }),
        referred_by: form.referred_by || undefined,
        date_of_birth: form.dateOfBirth,
      });
      navigate(defaultRouteForUser(user));
    } catch (err) {
      if (err.normalized?.fields) setFieldErrors(err.normalized.fields);
      setError(err.normalized?.message || 'Registration failed');
      setStep(STEPS[1]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--onboarding">
      <div className="onboarding-card card">
        {step !== STEPS[2] && (
          <>
            <div className="onboarding-card__header">
              <button type="button" className="onboarding-card__back" onClick={goBack} aria-label="Go back">
                <ArrowLeft size={18} />
              </button>
              <h1>{step === STEPS[0] ? 'Create account' : 'Finish signing up'}</h1>
              <span className="onboarding-card__spacer" aria-hidden="true" />
            </div>

            <ErrorMessage message={error} />

            {step === STEPS[0] && (
              <form onSubmit={handleAccountContinue} className="onboarding-form">
                <div className="form-group">
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email"
                    required
                  />
                  {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Password"
                    required
                  />
                  <p className="form-hint">Use 8+ characters with uppercase, number, and symbol.</p>
                </div>
                {searchParams.get('as') === 'host' && (
                  <p className="form-hint">You&apos;re signing up as a host. Your account role is detected from this signup flow.</p>
                )}
                <button type="submit" className="btn btn-primary onboarding-card__submit">Continue</button>
              </form>
            )}

            {step === STEPS[1] && (
              <form onSubmit={handleProfileContinue} className="onboarding-form">
                <fieldset className="onboarding-fieldset">
                  <legend className="label">Legal name</legend>
                  <input
                    className="input onboarding-input--joined-top"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="First name on ID"
                    required
                  />
                  <input
                    className="input onboarding-input--joined-bottom"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Last name on ID"
                    required
                  />
                  <p className="form-hint">Make sure this matches the name on your government ID.</p>
                </fieldset>

                <fieldset className="onboarding-fieldset">
                  <legend className="label">Date of birth</legend>
                  <div className="onboarding-date-wrap">
                    <input
                      type="date"
                      className="input"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      required
                      max={new Date().toISOString().slice(0, 10)}
                    />
                    <Calendar size={18} className="onboarding-date-icon" aria-hidden="true" />
                  </div>
                  <p className="form-hint">
                    To sign up, you need to be at least 18. Your birthday won&apos;t be shared with other people.
                  </p>
                </fieldset>

                <fieldset className="onboarding-fieldset">
                  <legend className="label">Contact info</legend>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    readOnly
                    aria-readonly="true"
                  />
                  <p className="form-hint">We&apos;ll email you trip confirmations and receipts.</p>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="Phone (10 digits)"
                    pattern="\d{10}"
                    required
                  />
                </fieldset>

                <div className="form-group">
                  <label className="label">Referral code (optional)</label>
                  <input
                    className="input"
                    value={form.referred_by}
                    onChange={(e) => setForm({ ...form, referred_by: e.target.value })}
                  />
                </div>

                <p className="onboarding-legal">
                  By selecting <strong>Agree and continue</strong>, I agree to StayEase&apos;s{' '}
                  <Link to="/terms" target="_blank" rel="noreferrer">Terms of Service</Link>,{' '}
                  <Link to="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</Link>, and
                  community commitment.
                </p>

                <button type="submit" className="btn btn-primary onboarding-card__submit">
                  Agree and continue
                </button>
              </form>
            )}

            <p className="onboarding-card__footer">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </>
        )}
      </div>

      <CommunityCommitmentModal
        open={step === STEPS[2]}
        onAgree={submitRegistration}
        onDecline={() => setStep(STEPS[1])}
      />

      {loading && (
        <div className="onboarding-loading">
          <Spinner label="Creating your account..." />
        </div>
      )}
    </div>
  );
}
