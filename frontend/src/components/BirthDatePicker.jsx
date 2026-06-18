import { useEffect, useId, useRef, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';
import {
  MIN_SIGNUP_AGE,
  daysInMonth,
  formatDisplayDate,
  getBirthYearRange,
  isBirthDayDisabled,
  isBirthMonthDisabled,
  parseISODate,
  toISODate,
} from '../utils/dates';

const MONTHS = [
  { index: 0, label: 'Jan', full: 'January' },
  { index: 1, label: 'Feb', full: 'February' },
  { index: 2, label: 'Mar', full: 'March' },
  { index: 3, label: 'Apr', full: 'April' },
  { index: 4, label: 'May', full: 'May' },
  { index: 5, label: 'Jun', full: 'June' },
  { index: 6, label: 'Jul', full: 'July' },
  { index: 7, label: 'Aug', full: 'August' },
  { index: 8, label: 'Sep', full: 'September' },
  { index: 9, label: 'Oct', full: 'October' },
  { index: 10, label: 'Nov', full: 'November' },
  { index: 11, label: 'Dec', full: 'December' },
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function resetPickerState(value) {
  if (!value) {
    return { step: 'year', year: null, month: null };
  }
  const date = parseISODate(value);
  if (!date) return { step: 'year', year: null, month: null };
  return {
    step: 'year',
    year: date.getFullYear(),
    month: date.getMonth(),
  };
}

export default function BirthDatePicker({
  value = '',
  onChange,
  label,
  id,
  placeholder = 'Select date of birth',
  minAge = MIN_SIGNUP_AGE,
  className = '',
  variant = 'input',
  required = false,
  invalid = false,
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('year');
  const [pickedYear, setPickedYear] = useState(null);
  const [pickedMonth, setPickedMonth] = useState(null);

  const years = getBirthYearRange(minAge);
  const display = value ? formatDisplayDate(value) : placeholder;

  const openPicker = () => {
    const next = resetPickerState(value);
    setStep(next.step);
    setPickedYear(next.year);
    setPickedMonth(next.month);
    setOpen(true);
  };

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

  const handleYearSelect = (year) => {
    setPickedYear(year);
    setPickedMonth(null);
    setStep('month');
  };

  const handleMonthSelect = (monthIndex) => {
    setPickedMonth(monthIndex);
    setStep('day');
  };

  const handleDaySelect = (day) => {
    const iso = toISODate(new Date(pickedYear, pickedMonth, day));
    onChange?.(iso);
    setOpen(false);
  };

  const goBack = () => {
    if (step === 'day') {
      setStep('month');
      return;
    }
    if (step === 'month') {
      setStep('year');
      setPickedMonth(null);
    }
  };

  const stepTitle = () => {
    if (step === 'year') return 'Select year';
    if (step === 'month') return String(pickedYear);
    const monthName = MONTHS[pickedMonth]?.full || '';
    return `${monthName} ${pickedYear}`;
  };

  const renderDayGrid = () => {
    const firstDay = new Date(pickedYear, pickedMonth, 1).getDay();
    const totalDays = daysInMonth(pickedYear, pickedMonth);
    const cells = [];

    for (let i = 0; i < firstDay; i += 1) {
      cells.push(<div key={`empty-${i}`} className="birth-date-picker__day birth-date-picker__day--empty" />);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const iso = toISODate(new Date(pickedYear, pickedMonth, day));
      const disabled = isBirthDayDisabled(pickedYear, pickedMonth, day, minAge);
      const selected = value === iso;
      cells.push(
        <button
          key={iso}
          type="button"
          className={[
            'birth-date-picker__day',
            selected && 'birth-date-picker__day--selected',
            disabled && 'birth-date-picker__day--disabled',
          ].filter(Boolean).join(' ')}
          disabled={disabled}
          onClick={() => handleDaySelect(day)}
          aria-label={iso}
          aria-pressed={selected}
        >
          {day}
        </button>,
      );
    }

    return (
      <>
        <div className="birth-date-picker__weekdays">
          {WEEKDAYS.map((d) => (
            <span key={d} className="birth-date-picker__weekday">{d}</span>
          ))}
        </div>
        <div className="birth-date-picker__day-grid">{cells}</div>
      </>
    );
  };

  const triggerClass = [
    'date-picker__trigger',
    `date-picker__trigger--${variant}`,
    open && 'date-picker__trigger--open',
    !value && 'date-picker__trigger--placeholder',
    invalid && 'date-picker__trigger--error',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={`date-picker birth-date-picker ${open ? 'date-picker--open' : ''}`} ref={rootRef}>
      {label && (
        <label className="date-picker__label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <button
        id={fieldId}
        type="button"
        className={triggerClass}
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required}
        aria-invalid={invalid || undefined}
      >
        <CalendarIcon size={variant === 'input' ? 18 : 16} className="date-picker__icon" aria-hidden />
        <span className="date-picker__value">{display}</span>
      </button>
      {open && (
        <div className="date-picker__popover birth-date-picker__popover" role="dialog" aria-label={label || 'Choose date of birth'}>
          <div className="birth-date-picker__header">
            {step !== 'year' ? (
              <button type="button" className="birth-date-picker__back" onClick={goBack}>
                <ChevronLeft size={18} aria-hidden />
                <span>{step === 'month' ? 'Year' : MONTHS[pickedMonth]?.full}</span>
              </button>
            ) : (
              <span className="birth-date-picker__back birth-date-picker__back--placeholder" aria-hidden />
            )}
            <p className="birth-date-picker__title">{stepTitle()}</p>
          </div>

          {step === 'year' && (
            <div className="birth-date-picker__years" role="listbox" aria-label="Select year">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  role="option"
                  aria-selected={value && parseISODate(value)?.getFullYear() === year}
                  className={[
                    'birth-date-picker__chip',
                    pickedYear === year && 'birth-date-picker__chip--active',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleYearSelect(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {step === 'month' && (
            <div className="birth-date-picker__months" role="listbox" aria-label="Select month">
              {MONTHS.map(({ index, label: monthLabel }) => {
                const disabled = isBirthMonthDisabled(pickedYear, index, minAge);
                return (
                  <button
                    key={monthLabel}
                    type="button"
                    role="option"
                    aria-selected={pickedMonth === index}
                    className={[
                      'birth-date-picker__chip',
                      pickedMonth === index && 'birth-date-picker__chip--active',
                      disabled && 'birth-date-picker__chip--disabled',
                    ].filter(Boolean).join(' ')}
                    disabled={disabled}
                    onClick={() => handleMonthSelect(index)}
                  >
                    {monthLabel}
                  </button>
                );
              })}
            </div>
          )}

          {step === 'day' && renderDayGrid()}
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
