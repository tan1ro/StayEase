export const LISTING_DRAFT_STORAGE_KEY = 'stayease.host.addRoomDraft';

const PLACEHOLDER_TITLE = 'New StayEase listing';
const PLACEHOLDER_DESC_PREFIX = 'A comfortable stay at our property';

const WIZARD_STEP_ORDER = [
  'intro-1',
  'category',
  'place-type',
  'location',
  'basics',
  'bathrooms',
  'who-else',
  'intro-2',
  'amenities',
  'photos',
  'title',
  'stay-vibes',
  'description',
  'intro-3',
  'booking-settings',
  'pricing-gst',
  'offers',
  'hospitality',
  'safety',
  'review',
];

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function isPlaceholderTitle(title) {
  const value = (title || '').trim();
  return !value || value === PLACEHOLDER_TITLE || value.length < 5;
}

export function isPlaceholderDescription(description) {
  const value = (description || '').trim();
  return value.length < 50 || value.startsWith(PLACEHOLDER_DESC_PREFIX);
}

export function isDraftListing(room) {
  return Boolean(room && room.is_available === false);
}

export function getDraftProgress() {
  if (typeof window === 'undefined') return null;
  const saved = safeJsonParse(window.localStorage.getItem(LISTING_DRAFT_STORAGE_KEY));
  if (!saved?.roomId || typeof saved.stepId !== 'string') return null;
  return saved;
}

export function saveDraftProgress(roomId, stepId) {
  if (typeof window === 'undefined' || !roomId || !stepId) return;
  window.localStorage.setItem(
    LISTING_DRAFT_STORAGE_KEY,
    JSON.stringify({ roomId, stepId, updatedAt: Date.now() }),
  );
}

export function clearDraftProgress() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LISTING_DRAFT_STORAGE_KEY);
}

/** Pick the first wizard step that still needs work based on saved room data. */
export function inferWizardStepId(room) {
  if (!room) return 'intro-1';

  const city = room.location?.city?.trim();
  const area = room.location?.area?.trim();
  if (!city || !area) return 'location';

  if (!room.photos?.length) return 'photos';
  if (isPlaceholderTitle(room.title)) return 'title';
  if (isPlaceholderDescription(room.description)) return 'description';
  if ((room.price_per_night || 0) < 100) return 'pricing-gst';

  return 'review';
}

export function wizardStepIndex(stepId) {
  const idx = WIZARD_STEP_ORDER.indexOf(stepId);
  return idx >= 0 ? idx : 0;
}

export function getListingResumePath(roomId) {
  return `/host/rooms/add?roomId=${encodeURIComponent(roomId)}`;
}

export function pickMostRecentDraft(rooms) {
  const drafts = (rooms || []).filter(isDraftListing);
  if (!drafts.length) return null;

  return [...drafts].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
    return bTime - aTime;
  })[0];
}

export function getListingResumeLabel(room) {
  if (!room) return 'Continue listing';
  if (isPlaceholderTitle(room.title)) return 'Continue listing setup';
  return `Continue “${room.title.trim().slice(0, 32)}${room.title.length > 32 ? '…' : ''}”`;
}
