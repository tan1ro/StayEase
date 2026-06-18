/** Matches backend UserCreate password rules. */
export function getPasswordChecks(password = '') {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^\w\s]/.test(password),
  };
}

export function validatePassword(password = '') {
  const checks = getPasswordChecks(password);

  if (!password) {
    return { valid: false, message: 'Password is required', checks };
  }
  if (!checks.length) {
    return { valid: false, message: 'Password must be at least 8 characters', checks };
  }
  if (!checks.upper) {
    return { valid: false, message: 'Password must include an uppercase letter', checks };
  }
  if (!checks.number) {
    return { valid: false, message: 'Password must include a number', checks };
  }
  if (!checks.special) {
    return { valid: false, message: 'Password must include a special character', checks };
  }

  return { valid: true, message: '', checks };
}

export function validateConfirmPassword(password = '', confirmPassword = '') {
  if (!confirmPassword) {
    return { valid: false, message: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' };
  }
  return { valid: true, message: '' };
}
