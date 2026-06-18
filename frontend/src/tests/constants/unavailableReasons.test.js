import { describe, expect, it } from 'vitest';
import {
  UNAVAILABLE_REASONS,
  buildUnavailabilityPayload,
  formatUnavailableReason,
  isUnavailabilityReasonValid,
} from '../../constants/unavailableReasons';

describe('unavailableReasons', () => {
  it('lists preset reasons for hosts', () => {
    expect(UNAVAILABLE_REASONS.map((r) => r.value)).toContain('maintenance');
    expect(UNAVAILABLE_REASONS.map((r) => r.value)).toContain('other');
  });

  it('requires a note when reason is other', () => {
    expect(isUnavailabilityReasonValid('maintenance', '')).toBe(true);
    expect(isUnavailabilityReasonValid('other', 'ab')).toBe(false);
    expect(isUnavailabilityReasonValid('other', 'Room repaint')).toBe(true);
  });

  it('formats preset and custom reasons for host display', () => {
    expect(formatUnavailableReason({ unavailable_reason: 'offline_booking' })).toBe('Offline / direct booking');
    expect(formatUnavailableReason({
      unavailable_reason: 'other',
      unavailable_reason_note: 'Reserved for wedding party',
    })).toBe('Reserved for wedding party');
  });

  it('builds publish and unpublish payloads', () => {
    expect(buildUnavailabilityPayload(true, '', '')).toEqual({ is_available: true });
    expect(buildUnavailabilityPayload(false, 'maintenance', '')).toEqual({
      is_available: false,
      unavailable_reason: 'maintenance',
      unavailable_reason_note: null,
    });
    expect(buildUnavailabilityPayload(false, 'other', '  Owner stay  ')).toEqual({
      is_available: false,
      unavailable_reason: 'other',
      unavailable_reason_note: 'Owner stay',
    });
  });
});
