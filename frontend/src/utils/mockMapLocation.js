import { SEARCH_LOCATIONS } from '../constants/searchLocations';

function cityCenter(city) {
  const normalized = (city || '').trim().toLowerCase();
  if (!normalized) return { lat: 12.9716, lng: 77.5946 };

  const match = SEARCH_LOCATIONS.find((loc) => {
    const value = loc.value.toLowerCase();
    return normalized === value || normalized.includes(value) || value.includes(normalized);
  });

  return match ? { lat: match.lat, lng: match.lng } : { lat: 12.9716, lng: 77.5946 };
}

function stableOffset(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  const unit = (n) => ((Math.abs(n) % 1000) / 1000) * 2 - 1;
  const radius = 0.012;
  return {
    lat: unit(hash) * radius,
    lng: unit(hash >> 11) * radius,
  };
}

/** Stable approximate coordinates within the listing's neighbourhood. */
export function getMockListingCoordinates(roomId, location = {}) {
  const hasCoords = location.lat != null && location.lng != null
    && !Number.isNaN(Number(location.lat))
    && !Number.isNaN(Number(location.lng));

  const base = hasCoords
    ? { lat: Number(location.lat), lng: Number(location.lng) }
    : cityCenter(location.city);

  const offset = stableOffset(String(roomId || location.city || 'default'));

  return {
    lat: Number((base.lat + offset.lat).toFixed(5)),
    lng: Number((base.lng + offset.lng).toFixed(5)),
  };
}

export function buildOpenStreetMapEmbedUrl(lat, lng, zoom = 0.018) {
  const bbox = `${lng - zoom}%2C${lat - zoom}%2C${lng + zoom}%2C${lat + zoom}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}
