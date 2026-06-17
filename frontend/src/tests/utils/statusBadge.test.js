import { describe, it, expect } from 'vitest';
import { formatStatusLabel, getStatusBadgeVariant } from '../../utils/statusBadge';

describe('statusBadge', () => {
  it('title-cases status labels', () => {
    expect(formatStatusLabel('confirmed')).toBe('Confirmed');
    expect(formatStatusLabel('pending')).toBe('Pending');
    expect(formatStatusLabel('failed')).toBe('Failed');
  });

  it('maps statuses to badge variants', () => {
    expect(getStatusBadgeVariant('confirmed')).toBe('success');
    expect(getStatusBadgeVariant('pending')).toBe('warning');
    expect(getStatusBadgeVariant('failed')).toBe('danger');
    expect(getStatusBadgeVariant('cancelled')).toBe('danger');
  });
});
