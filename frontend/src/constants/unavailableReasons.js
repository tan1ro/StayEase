export const UNAVAILABLE_REASONS = [
  { value: 'maintenance', label: 'Under maintenance' },
  { value: 'offline_booking', label: 'Offline / direct booking' },
  { value: 'owner_use', label: 'Owner or family use' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'other', label: 'Other (specify)' },
];

export function formatUnavailableReason(room) {
  if (!room?.unavailable_reason) return null;
  if (room.unavailable_reason === 'other') {
    const note = (room.unavailable_reason_note || '').trim();
    return note || 'Other';
  }
  const preset = UNAVAILABLE_REASONS.find((r) => r.value === room.unavailable_reason);
  return preset?.label || room.unavailable_reason;
}

export function isUnavailabilityReasonValid(reason, note) {
  if (!reason) return false;
  if (reason === 'other') return (note || '').trim().length >= 3;
  return true;
}

export function buildUnavailabilityPayload(isAvailable, reason, note) {
  if (isAvailable) {
    return { is_available: true };
  }
  const payload = {
    is_available: false,
    unavailable_reason: reason,
  };
  if (reason === 'other') {
    payload.unavailable_reason_note = note.trim();
  } else {
    payload.unavailable_reason_note = null;
  }
  return payload;
}
