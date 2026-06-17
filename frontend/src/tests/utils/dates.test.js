import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  BOOKING_CALENDAR_MONTHS,
  maxBookableDateISO,
  maxBookableMonthISO,
  minBookableMonthISO,
  canNavigateToNextMonth,
  isMonthInBookingWindow,
} from '../../utils/dates';

describe('booking calendar window', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows booking up to 24 months from the current month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17)); // June 2026

    expect(minBookableMonthISO()).toBe('2026-06');
    expect(maxBookableMonthISO()).toBe('2028-06');
    expect(maxBookableDateISO()).toBe('2028-06-30');
    expect(BOOKING_CALENDAR_MONTHS).toBe(24);
  });

  it('blocks navigating past the final bookable month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17));

    expect(canNavigateToNextMonth('2028-04', 2)).toBe(true);
    expect(canNavigateToNextMonth('2028-05', 2)).toBe(false);
  });

  it('validates host calendar month bounds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17));

    expect(isMonthInBookingWindow(2026, 5)).toBe(true);
    expect(isMonthInBookingWindow(2028, 5)).toBe(true);
    expect(isMonthInBookingWindow(2025, 11)).toBe(false);
    expect(isMonthInBookingWindow(2028, 6)).toBe(false);
  });
});
