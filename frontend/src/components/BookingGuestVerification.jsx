import { useEffect, useState } from 'react';
import { UserCheck, UserRound } from 'lucide-react';
import { bookingsApi } from '../api/api';
import ErrorMessage from './ErrorMessage';
import { Icon, ICON } from './ui/Icon';
import VerificationImageUpload from './VerificationImageUpload';
import { validateFaceInImage } from '../utils/faceValidation';
import {
  formatAadharDisplay,
  idNumberHint,
  normalizeIdNumber,
  validateIdNumber,
  validateIndianPhone,
  validateVerificationImage,
} from '../utils/identityValidation';

export function defaultGuestVerification(user) {
  return {
    bookingFor: 'self',
    stayingGuestName: '',
    stayingGuestPhone: '',
    idType: user?.identity_proof?.type || 'aadhar',
    idNumber: user?.identity_proof?.number || '',
    idFile: null,
    idPreview: null,
    guestPhotoFile: null,
    guestPhotoPreview: null,
    useSavedId: Boolean(user?.identity_proof?.document_url),
    fieldErrors: {},
    photoSuccess: '',
    idSuccess: '',
  };
}

function revokePreview(url) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

function clearIdUpload(state) {
  revokePreview(state.idPreview);
  return {
    ...state,
    idFile: null,
    idPreview: null,
    idSuccess: '',
    fieldErrors: { ...state.fieldErrors, idFile: '' },
  };
}

function clearGuestPhoto(state) {
  revokePreview(state.guestPhotoPreview);
  return {
    ...state,
    guestPhotoFile: null,
    guestPhotoPreview: null,
    photoSuccess: '',
    fieldErrors: { ...state.fieldErrors, guestPhoto: '' },
  };
}

async function uploadVerificationFile(file) {
  const { data } = await bookingsApi.uploadVerification(file);
  return data.url;
}

export async function prepareBookingVerification(state, user, uploadFn = uploadVerificationFile) {
  const errors = {};

  if (state.bookingFor === 'other') {
    const name = state.stayingGuestName?.trim();
    if (!name) errors.stayingGuestName = 'Enter the full name of the person checking in';
    if (name && name.length < 2) errors.stayingGuestName = 'Name must be at least 2 characters';

    const phoneResult = validateIndianPhone(state.stayingGuestPhone);
    if (!phoneResult.valid) errors.stayingGuestPhone = phoneResult.message;

    if (!state.guestPhotoFile) {
      errors.guestPhoto = 'Upload a photograph of the person checking in';
    }
  }

  if (state.bookingFor === 'self' && !state.useSavedId) {
    const idResult = validateIdNumber(state.idType, state.idNumber);
    if (!idResult.valid) errors.idNumber = idResult.message;
    if (!state.idFile) errors.idFile = 'Upload your government ID document';
  }

  if (Object.keys(errors).length) {
    const first = Object.values(errors)[0];
    const err = new Error(first);
    err.fieldErrors = errors;
    throw err;
  }

  const payload = { booking_for: state.bookingFor };

  if (state.bookingFor === 'other') {
    payload.staying_guest_name = state.stayingGuestName.trim();
    const phoneResult = validateIndianPhone(state.stayingGuestPhone);
    if (phoneResult.value) payload.staying_guest_phone = phoneResult.value;
    payload.guest_photo_url = await uploadFn(state.guestPhotoFile);
  } else if (state.useSavedId && user?.identity_proof?.document_url) {
    payload.identity_proof = {
      type: user.identity_proof.type,
      number: user.identity_proof.number,
      document_url: user.identity_proof.document_url,
    };
  } else {
    const idResult = validateIdNumber(state.idType, state.idNumber);
    const documentUrl = await uploadFn(state.idFile);
    payload.identity_proof = {
      type: state.idType,
      number: idResult.value,
      document_url: documentUrl,
    };
  }

  return payload;
}

export default function BookingGuestVerification({ value, onChange, user, error = '' }) {
  const [validatingPhoto, setValidatingPhoto] = useState(false);
  const [validatingId, setValidatingId] = useState(false);

  const set = (patch) => onChange((prev) => ({ ...prev, ...patch }));
  const setError = (field, message) =>
    onChange((prev) => ({ ...prev, fieldErrors: { ...prev.fieldErrors, [field]: message } }));
  const clearError = (field) =>
    onChange((prev) => {
      if (!prev.fieldErrors?.[field]) return prev;
      const next = { ...prev.fieldErrors };
      delete next[field];
      return { ...prev, fieldErrors: next };
    });

  const savedId = user?.identity_proof;
  const hasSavedId = Boolean(savedId?.document_url);
  const errors = value.fieldErrors || {};

  useEffect(() => {
    return () => {
      revokePreview(value.idPreview);
      revokePreview(value.guestPhotoPreview);
    };
  }, []);

  const handleIdNumberChange = (raw) => {
    onChange((prev) => {
      const idNumber = normalizeIdNumber(prev.idType, raw);
      const fieldErrors = { ...prev.fieldErrors };
      delete fieldErrors.idNumber;

      // Aadhar: validate only when all 12 digits are entered; avoid errors while typing.
      if (prev.idType === 'aadhar') {
        if (idNumber.length === 12) {
          const result = validateIdNumber('aadhar', idNumber);
          if (!result.valid) fieldErrors.idNumber = result.message;
        }
      } else if (idNumber) {
        const result = validateIdNumber(prev.idType, idNumber);
        if (!result.valid) fieldErrors.idNumber = result.message;
      }
      return { ...prev, idNumber, fieldErrors };
    });
  };

  const handleIdTypeChange = (idType) => {
    onChange((prev) => {
      const idNumber = normalizeIdNumber(idType, prev.idNumber);
      const fieldErrors = { ...prev.fieldErrors };
      delete fieldErrors.idNumber;
      delete fieldErrors.idFile;
      if (idNumber) {
        const result = validateIdNumber(idType, idNumber);
        if (!result.valid) fieldErrors.idNumber = result.message;
      }
      return { ...prev, idType, idNumber, idSuccess: '', fieldErrors };
    });
  };

  const handleIdFileSelect = async (file) => {
    setValidatingId(true);
    clearError('idFile');
    try {
      const check = await validateVerificationImage(file, { allowPdf: true, minWidth: 200, minHeight: 200 });
      if (!check.valid) {
        setError('idFile', check.message);
        return;
      }
      revokePreview(value.idPreview);
      set({
        idFile: file,
        idPreview: URL.createObjectURL(file),
        idSuccess: file.type === 'application/pdf' ? 'Document uploaded.' : 'ID document uploaded.',
        useSavedId: false,
      });
    } finally {
      setValidatingId(false);
    }
  };

  const handleGuestPhotoSelect = async (file) => {
    setValidatingPhoto(true);
    clearError('guestPhoto');
    set({ photoSuccess: '' });
    try {
      const faceResult = await validateFaceInImage(file);
      if (!faceResult.valid) {
        setError('guestPhoto', faceResult.message);
        return;
      }
      revokePreview(value.guestPhotoPreview);
      set({
        guestPhotoFile: file,
        guestPhotoPreview: URL.createObjectURL(file),
        photoSuccess: faceResult.message,
      });
    } finally {
      setValidatingPhoto(false);
    }
  };

  const handleBookingForChange = (bookingFor) => {
    if (bookingFor === value.bookingFor) return;
    let next = { ...value, bookingFor, fieldErrors: {} };
    if (bookingFor === 'self') {
      next = clearGuestPhoto(next);
    } else {
      next = clearIdUpload(next);
      next.useSavedId = false;
    }
    onChange(next);
  };

  return (
    <section className="booking-guest-verification book-room__section card" aria-labelledby="guest-verification-title">
      <h2 id="guest-verification-title">Who is checking in?</h2>
      <p className="book-room__section-lead">
        Hotels verify the staying guest at check-in. Upload the required document now so it matches what you present at the property.
      </p>
      <ErrorMessage message={error} />

      <div className="booking-guest-verification__choices" role="radiogroup" aria-label="Who is checking in">
        <button
          type="button"
          className={`booking-guest-verification__choice${value.bookingFor === 'self' ? ' booking-guest-verification__choice--active' : ''}`}
          onClick={() => handleBookingForChange('self')}
          aria-pressed={value.bookingFor === 'self'}
        >
          <Icon icon={UserCheck} size={ICON.lg} />
          <span className="booking-guest-verification__choice-text">
            <strong>Myself</strong>
            <small>Verify with government ID proof</small>
          </span>
        </button>
        <button
          type="button"
          className={`booking-guest-verification__choice${value.bookingFor === 'other' ? ' booking-guest-verification__choice--active' : ''}`}
          onClick={() => handleBookingForChange('other')}
          aria-pressed={value.bookingFor === 'other'}
        >
          <Icon icon={UserRound} size={ICON.lg} />
          <span className="booking-guest-verification__choice-text">
            <strong>Someone else</strong>
            <small>Upload their photograph</small>
          </span>
        </button>
      </div>

      {value.bookingFor === 'other' ? (
        <div className="booking-guest-verification__panel">
          <p className="booking-guest-verification__note">
            The staying guest must present the same photograph at hotel check-in.
          </p>
          <div className="form-group">
            <label className="label" htmlFor="staying-guest-name">Guest full name</label>
            <input
              id="staying-guest-name"
              className={`input${errors.stayingGuestName ? ' input--error' : ''}`}
              value={value.stayingGuestName}
              onChange={(e) => {
                set({ stayingGuestName: e.target.value });
                clearError('stayingGuestName');
              }}
              placeholder="Name on hotel register"
              autoComplete="name"
              aria-invalid={Boolean(errors.stayingGuestName)}
            />
            {errors.stayingGuestName && (
              <p className="field-error" role="alert">{errors.stayingGuestName}</p>
            )}
          </div>
          <div className="form-group">
            <label className="label" htmlFor="staying-guest-phone">Guest phone (optional)</label>
            <input
              id="staying-guest-phone"
              className={`input${errors.stayingGuestPhone ? ' input--error' : ''}`}
              value={value.stayingGuestPhone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                onChange((prev) => {
                  const fieldErrors = { ...prev.fieldErrors };
                  delete fieldErrors.stayingGuestPhone;
                  if (digits.length === 10) {
                    const result = validateIndianPhone(digits);
                    if (!result.valid) fieldErrors.stayingGuestPhone = result.message;
                  }
                  return { ...prev, stayingGuestPhone: digits, fieldErrors };
                });
              }}
              placeholder="10-digit mobile"
              inputMode="numeric"
              autoComplete="tel"
              aria-invalid={Boolean(errors.stayingGuestPhone)}
            />
            {errors.stayingGuestPhone && (
              <p className="field-error" role="alert">{errors.stayingGuestPhone}</p>
            )}
          </div>
          <VerificationImageUpload
            id="guest-photo-upload"
            label="Guest photograph"
            hint="A clear front-facing photo — the guest must present the same image at check-in."
            preview={value.guestPhotoPreview}
            validating={validatingPhoto}
            validatingLabel="Checking photo…"
            successMessage={value.photoSuccess}
            error={errors.guestPhoto}
            alt="Guest check-in photograph"
            onFileSelect={handleGuestPhotoSelect}
            onRemove={() => onChange(clearGuestPhoto(value))}
          />
        </div>
      ) : (
        <div className="booking-guest-verification__panel">
          {hasSavedId && (
            <label className="booking-guest-verification__saved">
              <input
                type="checkbox"
                checked={value.useSavedId}
                onChange={(e) => {
                  const useSavedId = e.target.checked;
                  let next = { ...value, useSavedId };
                  if (useSavedId) next = clearIdUpload(next);
                  onChange(next);
                }}
              />
              <span>
                Use saved ID on file ({savedId.type}: {savedId.number})
              </span>
            </label>
          )}

          {!value.useSavedId && (
            <>
              <div className="form-row booking-guest-verification__id-fields">
                <div className="form-group">
                  <label className="label" htmlFor="booking-id-type">ID type</label>
                  <select
                    id="booking-id-type"
                    className="select"
                    value={value.idType}
                    onChange={(e) => handleIdTypeChange(e.target.value)}
                  >
                    <option value="aadhar">Aadhar (12 digits)</option>
                    <option value="pan">PAN (AAAAA9999A)</option>
                    <option value="passport">Passport</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="booking-id-number">ID number</label>
                  <input
                    id="booking-id-number"
                    className={`input${errors.idNumber ? ' input--error' : ''}`}
                    value={value.idType === 'aadhar' ? formatAadharDisplay(value.idNumber) : value.idNumber}
                    onChange={(e) => handleIdNumberChange(e.target.value)}
                    onBlur={() => {
                      onChange((prev) => {
                        if (!prev.idNumber) {
                          return {
                            ...prev,
                            fieldErrors: {
                              ...prev.fieldErrors,
                              idNumber: 'Enter your government ID number',
                            },
                          };
                        }
                        const result = validateIdNumber(prev.idType, prev.idNumber);
                        if (!result.valid) {
                          return {
                            ...prev,
                            fieldErrors: { ...prev.fieldErrors, idNumber: result.message },
                          };
                        }
                        return prev;
                      });
                    }}
                    placeholder="Enter ID number"
                    inputMode={value.idType === 'aadhar' ? 'numeric' : 'text'}
                    autoComplete="off"
                    aria-describedby="booking-id-number-hint"
                    aria-invalid={Boolean(errors.idNumber)}
                  />
                  <p id="booking-id-number-hint" className="form-hint">{idNumberHint(value.idType)}</p>
                  {errors.idNumber && (
                    <p className="field-error" role="alert">{errors.idNumber}</p>
                  )}
                </div>
              </div>
              <VerificationImageUpload
                id="id-document-upload"
                label="ID document"
                hint="Photo or PDF of your government ID."
                preview={value.idPreview}
                accept="image/*,.pdf"
                validating={validatingId}
                validatingLabel="Checking document…"
                successMessage={value.idSuccess}
                error={errors.idFile}
                alt="Government ID document"
                onFileSelect={handleIdFileSelect}
                onRemove={() => onChange(clearIdUpload(value))}
              />
            </>
          )}
        </div>
      )}
    </section>
  );
}
