import { useEffect, useId, useRef, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import Calendar from './Calendar';
import {
  formatDisplayDate,
  maxBookableDateISO,
  todayISO,
} from '../utils/dates';

export default function DatePicker({
  value = '',
  onChange,
  label,
  id,
  placeholder = 'Select date',
  min,
  max,
  maxMonthsAhead,
  className = '',
  variant = 'input',
  required = false,
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState((value || min || todayISO()).slice(0, 7));

  useEffect(() => {
    if (value) setMonth(value.slice(0, 7));
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const display = value ? formatDisplayDate(value, { short: true }) : placeholder;
  const minDate = min || todayISO();
  const maxDate = max ?? (maxMonthsAhead != null ? maxBookableDateISO(maxMonthsAhead) : undefined);

  const handleSelect = (iso) => {
    onChange?.(iso);
    setOpen(false);
  };

  const triggerClass = [
    'date-picker__trigger',
    `date-picker__trigger--${variant}`,
    open && 'date-picker__trigger--open',
    !value && 'date-picker__trigger--placeholder',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={`date-picker ${open ? 'date-picker--open' : ''}`} ref={rootRef}>
      {label && (
        <label className="date-picker__label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <button
        id={fieldId}
        type="button"
        className={triggerClass}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required}
      >
        <CalendarIcon size={variant === 'input' ? 18 : 16} className="date-picker__icon" aria-hidden />
        <span className="date-picker__value">{display}</span>
      </button>
      {open && (
        <div className="date-picker__popover" role="dialog" aria-label={label || 'Choose date'}>
          <Calendar
            month={month}
            onMonthChange={setMonth}
            selectedStart={value}
            selectedEnd={null}
            onDateClick={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
            monthsToShow={1}
          />
        </div>
      )}
      {required && (
        <input
          tabIndex={-1}
          className="date-picker__native-required"
          value={value}
          required
          onChange={() => {}}
          aria-hidden
        />
      )}
    </div>
  );
}
