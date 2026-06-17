const ID_HINTS = {
  aadhar: '12-digit Aadhar number',
  pan: 'Format: AAAAA9999A',
  passport: 'Passport number (7–9 characters)',
};

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

export function validateIndianPhone(phone = '', { required = false } = {}) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return required
      ? { valid: false, message: 'Enter a 10-digit mobile number', value: '' }
      : { valid: true, message: '', value: '' };
  }
  if (!/^\d{10}$/.test(digits)) {
    return { valid: false, message: 'Enter a valid 10-digit mobile number', value: digits };
  }
  return { valid: true, message: '', value: digits };
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
