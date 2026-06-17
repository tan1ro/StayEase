import { addDaysISO, parseISODate, todayISO } from './dates';

function formatDeadline(iso, time = '14:00') {
  const date = parseISODate(iso);
  if (!date) return '';
  const day = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const [hourStr, minuteStr = '00'] = time.split(':');
  const hour = Number(hourStr);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  return `${day}, ${hour12}:${minuteStr} ${ampm}`;
}

function shiftDays(iso, days) {
  return addDaysISO(iso, days);
}

export function getCancellationTimeline(policy = 'moderate', checkIn, checkInTime = '14:00') {
  const checkInDate = checkIn || addDaysISO(todayISO(), 14);
  const timeLabel = (iso) => `Before ${formatDeadline(iso, checkInTime)}`;
  const afterLabel = (iso) => `After ${formatDeadline(iso, checkInTime)}`;

  if (policy === 'flexible') {
    const partialStart = shiftDays(checkInDate, -1);
    return [
      {
        tier: 'Full refund',
        deadline: timeLabel(partialStart),
        description: 'Get back 100% of what you paid.',
      },
      {
        tier: 'Partial refund',
        deadline: timeLabel(checkInDate),
        description: 'Get back 50% of every night. No refund of the service fee.',
      },
      {
        tier: 'No refund',
        deadline: afterLabel(checkInDate),
        description: 'This reservation is non-refundable.',
      },
    ];
  }

  if (policy === 'strict') {
    const partialStart = shiftDays(checkInDate, -7);
    return [
      {
        tier: 'Partial refund',
        deadline: timeLabel(partialStart),
        description: 'Get back 50% of every night. No refund of the service fee.',
      },
      {
        tier: 'No refund',
        deadline: afterLabel(partialStart),
        description: 'This reservation is non-refundable.',
      },
    ];
  }

  // moderate (default)
  const fullUntil = shiftDays(checkInDate, -5);
  const partialUntil = shiftDays(checkInDate, -1);
  return [
    {
      tier: 'Full refund',
      deadline: timeLabel(fullUntil),
      description: 'Get back 100% of what you paid.',
    },
    {
      tier: 'Partial refund',
      deadline: timeLabel(partialUntil),
      description: 'Get back 50% of every night. No refund of the service fee.',
    },
    {
      tier: 'No refund',
      deadline: afterLabel(partialUntil),
      description: 'This reservation is non-refundable.',
    },
  ];
}

export function getCancellationSummary(policy = 'moderate') {
  const summaries = {
    flexible: 'Free cancellation until 24 hours before check-in.',
    moderate: 'Free cancellation until 5 days before check-in.',
    strict: '50% refund only if you cancel 7+ days before check-in.',
  };
  return summaries[policy] || summaries.moderate;
}
