import { CalendarDays } from 'lucide-react';
import { Icon, ICON } from './ui/Icon';
import { formatRangeLabel } from '../utils/dates';

export default function NextAvailableDates({
  suggestion,
  loading,
  onApply,
  context = 'selection',
}) {
  if (loading) {
    return (
      <div className="next-available-dates next-available-dates--loading" role="status">
        Finding next available dates…
      </div>
    );
  }

  if (!suggestion?.check_in || !suggestion?.check_out) {
    return (
      <div className="next-available-dates next-available-dates--empty" role="status">
        No open dates found in the next 2 years for this stay length. Try shorter dates or join the waitlist.
      </div>
    );
  }

  const rangeLabel = formatRangeLabel(suggestion.check_in, suggestion.check_out);
  const roomHint = suggestion.room_number
    ? ` · Room ${suggestion.room_number} is open`
    : '';

  const message = context === 'property'
    ? `All rooms are booked for your dates. Next available stay at this property: ${rangeLabel}${roomHint}.`
    : context === 'rooms'
      ? `Your selected rooms aren't open for these dates. Next available stay: ${rangeLabel}.`
      : `This room isn't available for your dates. Next available stay: ${rangeLabel}.`;

  return (
    <div className="next-available-dates" role="status">
      <div className="next-available-dates__content">
        <Icon icon={CalendarDays} size={ICON.md} className="next-available-dates__icon" />
        <div>
          <p className="next-available-dates__message">{message}</p>
          <p className="next-available-dates__hint">You can only book open dates — use the next available stay below.</p>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-sm next-available-dates__apply"
        onClick={() => onApply(suggestion.check_in, suggestion.check_out, suggestion)}
      >
        Use {rangeLabel}
      </button>
    </div>
  );
}
