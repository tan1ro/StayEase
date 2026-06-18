import { NEARBY_RADIUS_KM, SEARCH_LOCATIONS } from '../constants/searchLocations';
import { formatRangeLabel } from './dates';

export function readLocationFromParams(searchParams) {
  if (searchParams.get('nearby') === 'true') {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const label = searchParams.get('nearby_label') || 'Nearby';
    return {
      mode: 'nearby',
      label,
      city: '',
      search: '',
      lat: lat || '',
      lng: lng || '',
    };
  }
  const city = searchParams.get('city') || '';
  const search = searchParams.get('search') || '';
  if (city) {
    const match = SEARCH_LOCATIONS.find((loc) => loc.value.toLowerCase() === city.toLowerCase());
    return { mode: 'city', label: match?.label || city, city, search: '', lat: '', lng: '' };
  }
  if (search) {
    return { mode: 'search', label: search, city: '', search, lat: '', lng: '' };
  }
  return { mode: 'text', label: '', city: '', search: '', lat: '', lng: '' };
}

export function applyLocationToParams(next, location) {
  next.delete('nearby');
  next.delete('nearby_label');
  next.delete('lat');
  next.delete('lng');
  next.delete('radius_km');
  next.delete('city');
  next.delete('search');

  if (location.type === 'nearby') {
    next.set('nearby', 'true');
    next.set('lat', String(location.lat));
    next.set('lng', String(location.lng));
    next.set('radius_km', String(NEARBY_RADIUS_KM));
    if (location.label) next.set('nearby_label', location.label);
    return;
  }

  if (location.type === 'city' && location.city) {
    next.set('city', location.city);
    return;
  }

  const trimmed = (location.search || location.label || '').trim();
  if (trimmed) {
    const matchedCity = SEARCH_LOCATIONS.find(
      (loc) =>
        loc.value.toLowerCase() === trimmed.toLowerCase() ||
        loc.label.toLowerCase() === trimmed.toLowerCase(),
    );
    if (matchedCity) next.set('city', matchedCity.value);
    else next.set('search', trimmed);
  }
}

export function buildLocationSelection({ where, locationMode, coords, searchParams }) {
  if (locationMode === 'nearby' && coords.lat && coords.lng) {
    const label = searchParams.get('nearby_label') || where.trim() || 'Nearby';
    return { type: 'nearby', lat: Number(coords.lat), lng: Number(coords.lng), label };
  }
  const cityParam = searchParams.get('city');
  if (cityParam) {
    const match = SEARCH_LOCATIONS.find((loc) => loc.value.toLowerCase() === cityParam.toLowerCase());
    return { type: 'city', city: cityParam, label: match?.label || cityParam };
  }
  const trimmed = where.trim();
  if (!trimmed) return { type: 'search', search: '', label: '' };
  const matchedCity = SEARCH_LOCATIONS.find(
    (loc) =>
      loc.value.toLowerCase() === trimmed.toLowerCase() ||
      loc.label.toLowerCase() === trimmed.toLowerCase(),
  );
  if (matchedCity) return { type: 'city', city: matchedCity.value, label: matchedCity.label };
  return { type: 'search', search: trimmed, label: trimmed };
}

export function buildSearchParams(searchParams, { location, checkIn, checkOut, guests }) {
  const next = new URLSearchParams(searchParams);
  applyLocationToParams(next, location);
  if (checkIn) next.set('check_in', checkIn);
  else next.delete('check_in');
  if (checkOut) next.set('check_out', checkOut);
  else next.delete('check_out');
  if (guests && String(guests) !== '2') next.set('guests', String(guests));
  else next.delete('guests');
  return next;
}

export function syncSearchParams(searchParams, setSearchParams, updates) {
  setSearchParams(buildSearchParams(searchParams, updates));
}

export function commitSearchParams({
  navigate,
  pathname,
  searchParams,
  setSearchParams,
  location,
  checkIn,
  checkOut,
  guests,
}) {
  const next = buildSearchParams(searchParams, { location, checkIn, checkOut, guests });
  const search = next.toString();
  if (pathname !== '/') {
    navigate({ pathname: '/', search });
    return;
  }
  setSearchParams(next);
}

export function getMobileSearchSummary(searchParams) {
  const parts = [];
  const loc = readLocationFromParams(searchParams);
  if (loc.label) parts.push(loc.label);
  const ci = searchParams.get('check_in');
  const co = searchParams.get('check_out');
  if (ci || co) parts.push(formatRangeLabel(ci, co));
  const guests = searchParams.get('guests');
  if (guests && guests !== '2') parts.push(`${guests} guest${guests !== '1' ? 's' : ''}`);
  return parts.length ? parts.join(' · ') : 'Start your search';
}
