const HOST_SIGNUP_EMAILS = new Set([
  'host@stayease.com',
  'rahul@stayease.com',
  'ananya@stayease.com',
  'vikram@stayease.com',
  'lakshmi@stayease.com',
]);

export function normalizeRole(role) {
  if (role === 'guest') return 'tourist';
  if (role === 'tourist' || role === 'host' || role === 'admin') return role;
  return 'tourist';
}

export function isTouristRole(role) {
  return normalizeRole(role) === 'tourist';
}

export function isHostRole(role) {
  const normalized = normalizeRole(role);
  return normalized === 'host' || normalized === 'admin';
}

export function canAccessHostPortal(role) {
  return isHostRole(role);
}

export function detectRegistrationRole(email, { asHost = false } = {}) {
  const normalized = email?.trim().toLowerCase() || '';
  if (asHost || HOST_SIGNUP_EMAILS.has(normalized)) return 'host';
  return 'tourist';
}

export function defaultRouteForUser(user) {
  if (!user) return '/';
  return isHostRole(user.role) ? '/host' : '/';
}

export function roleLabel(role) {
  const normalized = normalizeRole(role);
  if (normalized === 'host') return 'Host';
  if (normalized === 'admin') return 'Admin';
  return 'Tourist';
}
