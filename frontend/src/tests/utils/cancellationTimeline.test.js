import { describe, expect, it } from 'vitest';
import { getCancellationSummary, getCancellationTimeline } from '../../utils/cancellationTimeline';

describe('getCancellationTimeline', () => {
  it('returns three tiers for moderate policy', () => {
    const timeline = getCancellationTimeline('moderate', '2026-08-08', '14:00');
    expect(timeline).toHaveLength(3);
    expect(timeline[0].tier).toBe('Full refund');
    expect(timeline[1].tier).toBe('Partial refund');
    expect(timeline[2].tier).toBe('No refund');
    expect(timeline[0].deadline).toContain('Before');
    expect(timeline[2].deadline).toContain('After');
  });

  it('returns two tiers for strict policy', () => {
    const timeline = getCancellationTimeline('strict', '2026-08-08', '14:00');
    expect(timeline).toHaveLength(2);
    expect(timeline[0].tier).toBe('Partial refund');
  });

  it('provides summary text per policy', () => {
    expect(getCancellationSummary('flexible')).toMatch(/24 hours/);
    expect(getCancellationSummary('moderate')).toMatch(/5 days/);
    expect(getCancellationSummary('strict')).toMatch(/7\+ days/);
  });
});
