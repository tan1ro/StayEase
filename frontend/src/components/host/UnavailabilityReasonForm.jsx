import {
  UNAVAILABLE_REASONS,
  isUnavailabilityReasonValid,
} from '../../constants/unavailableReasons';

export default function UnavailabilityReasonForm({
  reason,
  note,
  onReasonChange,
  onNoteChange,
  idPrefix = 'unavail',
  required = true,
}) {
  const showNote = reason === 'other';

  return (
    <div className="host-unavail-reason">
      <label className="label" htmlFor={`${idPrefix}-reason`}>
        Why is this room unavailable?{required ? ' *' : ''}
      </label>
      <select
        id={`${idPrefix}-reason`}
        className="select"
        value={reason || ''}
        onChange={(e) => onReasonChange(e.target.value)}
        required={required}
      >
        <option value="" disabled>Select a reason</option>
        {UNAVAILABLE_REASONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {showNote && (
        <>
          <label className="label" htmlFor={`${idPrefix}-note`} style={{ marginTop: '0.75rem' }}>
            Details *
          </label>
          <textarea
            id={`${idPrefix}-note`}
            className="textarea"
            rows={3}
            maxLength={200}
            value={note || ''}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Briefly explain why guests cannot book this room"
            required
          />
        </>
      )}
      <p className="host-page__subtitle" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
        Only you see this reason. Guests still see the room as &ldquo;Not available&rdquo; on the floor map.
      </p>
    </div>
  );
}

export { isUnavailabilityReasonValid };
