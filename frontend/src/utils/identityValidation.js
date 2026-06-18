import { DEFAULT_PHONE_COUNTRY, getPhoneCountry, PHONE_COUNTRIES } from '../constants/countryCodes';

const ID_HINTS = {
  aadhar: '12-digit Aadhar number',
  pan: 'Format: AAAAA9999A',
  passport: 'Passport number (7–9 characters)',
};

const ID_TYPE_LABELS = {
  aadhar: 'Aadhar',
  pan: 'PAN',
  passport: 'Passport',
};

export function formatIdType(type) {
  return ID_TYPE_LABELS[type] || String(type || '').replace(/_/g, ' ');
}

export function formatSavedIdNumber(type, number = '') {
  if (type === 'aadhar') return formatAadharDisplay(number);
  return String(number || '').trim();
}

export function idNumberHint(type) {
  return ID_HINTS[type] || 'Government ID number';
}

export function normalizeIdNumber(type, value = '') {
  if (type === 'aadhar') {
    return value.replace(/\D/g, '').slice(0, 12);
  }
  if (type === 'pan') {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  }
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

/** Display Aadhar as XXXX XXXX XXXX while storing digits only. */
export function formatAadharDisplay(digits = '') {
  const d = digits.replace(/\D/g, '').slice(0, 12);
  if (!d) return '';
  return [d.slice(0, 4), d.slice(4, 8), d.slice(8, 12)].filter(Boolean).join(' ');
}

export function validateIdNumber(type, value = '') {
  const normalized = normalizeIdNumber(type, value);
  if (!normalized) {
    return { valid: false, message: 'Enter your government ID number', value: normalized };
  }
  if (type === 'aadhar') {
    if (normalized.length !== 12) {
      return { valid: false, message: 'Aadhar must be exactly 12 digits', value: normalized };
    }
  } else if (type === 'pan') {
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(normalized)) {
      return { valid: false, message: 'PAN must match format AAAAA9999A', value: normalized };
    }
  } else if (type === 'passport') {
    if (!/^[A-Z][A-Z0-9]{6,8}$/.test(normalized)) {
      return {
        valid: false,
        message: 'Passport must start with a letter and be 7–9 characters',
        value: normalized,
      };
    }
  }
  return { valid: true, message: '', value: normalized };
}

export function formatPhoneNationalDisplay(national = '', countryCode = DEFAULT_PHONE_COUNTRY) {
  const digits = national.replace(/\D/g, '');
  if (!digits) return '';
  const country = getPhoneCountry(countryCode);
  if (country.code === 'IN' && digits.length <= 10) {
    const parts = [digits.slice(0, 5), digits.slice(5, 10)].filter(Boolean);
    return parts.join(' ');
  }
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, Math.ceil(digits.length / 2))} ${digits.slice(Math.ceil(digits.length / 2))}`;
}

export function normalizePhoneNational(national = '', countryCode = DEFAULT_PHONE_COUNTRY) {
  const country = getPhoneCountry(countryCode);
  return national.replace(/\D/g, '').slice(0, country.maxLength);
}

export function validatePhone(national = '', countryCode = DEFAULT_PHONE_COUNTRY, { required = false } = {}) {
  const country = getPhoneCountry(countryCode);
  const digits = normalizePhoneNational(national, countryCode);

  if (!digits) {
    return required
      ? { valid: false, message: `Enter your ${country.name} mobile number`, value: '', apiValue: '' }
      : { valid: true, message: '', value: '', apiValue: '' };
  }

  if (digits === '0000000000') {
    return { valid: false, message: 'Enter a valid phone number', value: digits, apiValue: '' };
  }

  if (!country.pattern.test(digits)) {
    return { valid: false, message: country.errorMessage, value: digits, apiValue: '' };
  }

  const apiValue = country.code === 'IN' ? digits : `${country.dialDigits}${digits}`;
  return { valid: true, message: '', value: digits, apiValue };
}

export function parseStoredPhone(stored = '') {
  const digits = String(stored || '').replace(/\D/g, '');
  if (!digits) return { countryCode: DEFAULT_PHONE_COUNTRY, national: '' };
  if (/^[6-9]\d{9}$/.test(digits)) {
    return { countryCode: 'IN', national: digits };
  }

  const sorted = PHONE_COUNTRIES
    .filter((c) => c.code !== 'IN')
    .sort((a, b) => b.dialDigits.length - a.dialDigits.length);

  for (const country of sorted) {
    if (digits.startsWith(country.dialDigits)) {
      const national = digits.slice(country.dialDigits.length);
      if (national.length >= country.minLength && national.length <= country.maxLength) {
        return { countryCode: country.code, national };
      }
    }
  }

  if (digits.length === 10) {
    return { countryCode: DEFAULT_PHONE_COUNTRY, national: digits };
  }

  return { countryCode: DEFAULT_PHONE_COUNTRY, national: digits.slice(-10) };
}

export function validateIndianPhone(phone = '', { required = false } = {}) {
  return validatePhone(phone, DEFAULT_PHONE_COUNTRY, { required });
}

export function validateVerificationImage(
  file,
  { maxMb = 5, minWidth = 200, minHeight = 200, allowPdf = false } = {},
) {
  if (!file) {
    return { valid: false, message: 'Please choose a file to upload' };
  }

  const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/');

  if (isPdf && allowPdf) {
    if (file.size > maxMb * 1024 * 1024) {
      return { valid: false, message: `File must be under ${maxMb} MB` };
    }
    return { valid: true, message: '' };
  }

  if (!isImage) {
    return { valid: false, message: allowPdf ? 'Upload an image or PDF file' : 'Upload a valid image file' };
  }

  if (file.size > maxMb * 1024 * 1024) {
    return { valid: false, message: `Image must be under ${maxMb} MB` };
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < minWidth || img.height < minHeight) {
        resolve({
          valid: false,
          message: `Image must be at least ${minWidth}×${minHeight}px`,
        });
        return;
      }
      resolve({ valid: true, message: '', width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, message: 'Could not read this image. Try another file.' });
    };
    img.src = url;
  });
}
