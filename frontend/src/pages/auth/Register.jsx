import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ErrorMessage from '../../components/ErrorMessage';
import OAuthButtons from '../../components/OAuthButtons';
import BirthDatePicker from '../../components/BirthDatePicker';
import Spinner from '../../components/Spinner';
import CommunityCommitmentModal from '../../components/onboarding/CommunityCommitmentModal';
import LegalAcceptance from '../../components/LegalAcceptance';
import { authApi, getToken, setToken, setStoredUser } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { userNeedsPhone } from '../../utils/auth';
import { detectRegistrationRole, isHostRole, normalizeRole } from '../../utils/roles';

const STEPS = ['account', 'profile', 'community'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

function isAdult(dob) {
  if (!dob) return false;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 18;
}

function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function validateAccountStep({ email, password, confirmPassword }) {
  const fieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) fieldErrors.email = 'Email is required';
  else if (!EMAIL_RE.test(trimmedEmail)) fieldErrors.email = 'Enter a valid email address';

  if (!password) fieldErrors.password = 'Password is required';
  else if (!PASSWORD_RE.test(password)) {
    fieldErrors.password = 'Use 8+ characters with uppercase, number, and special character';
  }

  if (!confirmPassword) fieldErrors.confirmPassword = 'Please confirm your password';
  else if (password !== confirmPassword) fieldErrors.confirmPassword = 'Passwords do not match';

  return fieldErrors;
}

function validateProfileStep({ firstName, lastName, dateOfBirth, phone, acceptedLegal, isOAuth }) {
  const fieldErrors = {};

  if (!firstName.trim()) fieldErrors.firstName = 'First name is required';
  if (!lastName.trim()) fieldErrors.lastName = 'Last name is required';
  if (!dateOfBirth) fieldErrors.dateOfBirth = 'Date of birth is required';
  else if (!isAdult(dateOfBirth)) fieldErrors.dateOfBirth = 'You must be at least 18 years old';

  if (!phone) fieldErrors.phone = 'Phone number is required';
  else if (!/^\d{10}$/.test(phone)) fieldErrors.phone = 'Enter a valid 10-digit phone number';

  if (!acceptedLegal) fieldErrors.legal = 'Please accept the Terms of Service, Privacy Policy, and Cookie Policy';

  if (isOAuth && Object.keys(fieldErrors).length === 1 && fieldErrors.legal) {
    // keep legal separate from form fields
  }

  return fieldErrors;
}

export default function Register() {
  const { register, setUser, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(STEPS[0]);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    referred_by: searchParams.get('ref') || '',
  });
  const [isOAuth, setIsOAuth] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const asHost = searchParams.get('as') === 'host';

  useEffect(() => {
    if (searchParams.get('step') !== 'profile') return;
    setStep(STEPS[1]);
    if (!user) return;
    if (userNeedsPhone(user)) setIsOAuth(true);
    const names = splitName(user.name);
    setForm((prev) => ({
      ...prev,
      email: user.email,
      firstName: names.firstName,
      lastName: names.lastName,
    }));
  }, [searchParams, user]);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const goBack = () => {
    setError('');
    setFieldErrors({});
    if (step === STEPS[1] && !isOAuth) setStep(STEPS[0]);
    else navigate('/login');
  };

  const handleAccountContinue = (e) => {
    e.preventDefault();
    const nextFieldErrors = validateAccountStep(form);
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setError('Please fix the highlighted fields');
      return;
    }
    setError('');
    setFieldErrors({});
    setStep(STEPS[1]);
  };

  const handleProfileContinue = (e) => {
    e.preventDefault();
    const nextFieldErrors = validateProfileStep({ ...form, acceptedLegal, isOAuth });
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setError(nextFieldErrors.legal || 'Please fix the highlighted fields');
      return;
    }
    setError('');
    setFieldErrors({});
    setStep(STEPS[2]);
  };

  const handleOAuthSuccess = (data) => {
    setToken(data.access_token);
    const normalizedUser = { ...data.user, role: normalizeRole(data.user.role) };
    setStoredUser(normalizedUser);
    setUser(normalizedUser);

    const names = splitName(data.user.name);
    setForm((prev) => ({
      ...prev,
      email: data.user.email,
      firstName: names.firstName,
      lastName: names.lastName,
    }));
    setIsOAuth(true);
    setError('');
    setFieldErrors({});

    if (data.needs_phone || userNeedsPhone(data.user)) {
      setStep(STEPS[1]);
      return;
    }

    navigate(isHostRole(data.user.role) ? '/host' : '/');
  };

  const submitRegistration = async () => {
    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      if (isOAuth) {
        const { data } = await authApi.completeProfile({
          name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          phone: form.phone,
          date_of_birth: form.dateOfBirth,
        });
        const normalizedUser = { ...data.user, role: normalizeRole(data.user.role) };
        setStoredUser(normalizedUser);
        setUser(normalizedUser);
        navigate(isHostRole(normalizedUser.role) ? '/host' : '/');
        return;
      }

      const user = await register({
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
        role: detectRegistrationRole(form.email, { asHost }),
        referred_by: form.referred_by || undefined,
        date_of_birth: form.dateOfBirth,
      });
      if (getToken()) setToken(getToken());
      setStoredUser(user);
      navigate(isHostRole(user.role) ? '/host' : '/');
    } catch (err) {
      if (err.normalized?.fields) setFieldErrors(err.normalized.fields);
      setError(err.normalized?.message || 'Registration failed');
      setStep(STEPS[1]);
    } finally {
      setLoading(false);
    }
  };

  const accountStep = (
    <>
      <h1>Create account</h1>
      <p className="page-subtitle">Join StayEase to book stays or host with GST-ready billing.</p>
      <ErrorMessage message={error} />
      <form onSubmit={handleAccountContinue} noValidate>
        <div className="form-group">
          <label className="label" htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            className={`input${fieldErrors.email ? ' input--error' : ''}`}
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              clearFieldError('email');
              if (error) setError('');
            }}
            autoComplete="email"
          />
          {fieldErrors.email && <span className="field-error" role="alert">{fieldErrors.email}</span>}
        </div>
        <div className="form-group">
          <label className="label" htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            className={`input${fieldErrors.password ? ' input--error' : ''}`}
            value={form.password}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value });
              clearFieldError('password');
              if (error) setError('');
            }}
            autoComplete="new-password"
          />
          <p className="form-hint">Use 8+ characters with uppercase, number, and special character.</p>
          {fieldErrors.password && <span className="field-error" role="alert">{fieldErrors.password}</span>}
        </div>
        <div className="form-group">
          <label className="label" htmlFor="register-confirm-password">Confirm password</label>
          <input
            id="register-confirm-password"
            type="password"
            className={`input${fieldErrors.confirmPassword ? ' input--error' : ''}`}
            value={form.confirmPassword}
            onChange={(e) => {
              setForm({ ...form, confirmPassword: e.target.value });
              clearFieldError('confirmPassword');
              if (error) setError('');
            }}
            autoComplete="new-password"
          />
          {fieldErrors.confirmPassword && (
            <span className="field-error" role="alert">{fieldErrors.confirmPassword}</span>
          )}
        </div>
        {asHost && (
          <p className="form-hint">You&apos;re signing up as a host. Your account role is detected from this signup flow.</p>
        )}
        <button type="submit" className="btn btn-primary auth-card__submit">Continue</button>
      </form>
      <OAuthButtons
        asHost={asHost}
        referredBy={form.referred_by}
        onSuccess={handleOAuthSuccess}
        onError={setError}
      />
      <p className="auth-card__footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </>
  );

  const profileStep = (
  <>
      <div className="auth-card__back-row">
        <button type="button" className="auth-card__back" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={18} />
        </button>
        <h1>{isOAuth ? 'Add your details' : 'Finish signing up'}</h1>
      </div>
      <p className="page-subtitle">
        {isOAuth
          ? 'A phone number is required to complete your Google account on StayEase.'
          : 'Tell us a bit more before you join the community.'}
      </p>
      <ErrorMessage message={error} />
      <form onSubmit={handleProfileContinue} className="onboarding-form" noValidate>
        <fieldset className="onboarding-fieldset">
          <legend className="label">Legal name</legend>
          <input
            className={`input onboarding-input--joined-top${fieldErrors.firstName ? ' input--error' : ''}`}
            value={form.firstName}
            onChange={(e) => {
              setForm({ ...form, firstName: e.target.value });
              clearFieldError('firstName');
            }}
            placeholder="First name on ID"
          />
          {fieldErrors.firstName && <span className="field-error" role="alert">{fieldErrors.firstName}</span>}
          <input
            className={`input onboarding-input--joined-bottom${fieldErrors.lastName ? ' input--error' : ''}`}
            value={form.lastName}
            onChange={(e) => {
              setForm({ ...form, lastName: e.target.value });
              clearFieldError('lastName');
            }}
            placeholder="Last name on ID"
          />
          {fieldErrors.lastName && <span className="field-error" role="alert">{fieldErrors.lastName}</span>}
          <p className="form-hint">Make sure this matches the name on your government ID.</p>
        </fieldset>

        <fieldset className="onboarding-fieldset onboarding-fieldset--dob">
          <BirthDatePicker
            id="register-dob"
            label="Date of birth"
            value={form.dateOfBirth}
            onChange={(value) => {
              setForm({ ...form, dateOfBirth: value });
              clearFieldError('dateOfBirth');
            }}
            placeholder="Select date of birth"
            variant="input"
            required
            invalid={Boolean(fieldErrors.dateOfBirth)}
          />
          {fieldErrors.dateOfBirth && <span className="field-error" role="alert">{fieldErrors.dateOfBirth}</span>}
          <p className="form-hint">
            To sign up, you need to be at least 18. Your birthday won&apos;t be shared with other people.
          </p>
        </fieldset>

        <fieldset className="onboarding-fieldset">
          <legend className="label">Contact info</legend>
          <input type="email" className="input" value={form.email} readOnly aria-readonly="true" />
          <p className="form-hint">We&apos;ll email you trip confirmations and receipts.</p>
          <input
            className={`input${fieldErrors.phone ? ' input--error' : ''}`}
            value={form.phone}
            onChange={(e) => {
              setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) });
              clearFieldError('phone');
            }}
            placeholder="Phone (10 digits) *"
            inputMode="numeric"
            autoComplete="tel"
          />
          {fieldErrors.phone && <span className="field-error" role="alert">{fieldErrors.phone}</span>}
        </fieldset>

        {!isOAuth && (
          <div className="form-group">
            <label className="label">Referral code (optional)</label>
            <input
              className="input"
              value={form.referred_by}
              onChange={(e) => setForm({ ...form, referred_by: e.target.value })}
            />
          </div>
        )}

        <LegalAcceptance
          id="register-legal-acceptance"
          checked={acceptedLegal}
          onChange={(checked) => {
            setAcceptedLegal(checked);
            clearFieldError('legal');
          }}
          className="onboarding-legal-checkbox"
          suffix="."
        />
        {fieldErrors.legal && <span className="field-error" role="alert">{fieldErrors.legal}</span>}

        <p className="onboarding-legal">
          You will also be asked to accept our community commitment on the next step.
        </p>

        <button type="submit" className="btn btn-primary auth-card__submit">
          Agree and continue
        </button>
      </form>
    </>
  );

  return (
    <div className="auth-page auth-page--register">
      <div className={`${step === STEPS[0] ? 'auth-card' : 'auth-card auth-card--wide'} card`}>
        {step === STEPS[0] && accountStep}
        {step === STEPS[1] && profileStep}
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
