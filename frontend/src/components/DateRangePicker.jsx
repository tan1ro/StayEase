import { useEffect, useId, useRef, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import Calendar from './Calendar';
import {
  compareISO,
  formatDisplayDate,
  formatRangeLabel,
  maxBookableDateISO,
  todayISO,
} from '../utils/dates';

function useMonthsToShow() {
  const [count, setCount] = useState(2);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setCount(mq.matches ? 1 : 2);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return count;
}

export default function DateRangePicker({
  start = '',
  end = '',
  onChange,
  min,
  max,
  variant = 'input',
  className = '',
  startLabel = 'Check in',
  endLabel = 'Check out',
}) {
  const autoId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState((start || min || todayISO()).slice(0, 7));
  const [hoverDate, setHoverDate] = useState('');
  const [pickingEnd, setPickingEnd] = useState(false);
  const monthsToShow = useMonthsToShow();

  const minDate = min || todayISO();
  const maxDate = max || maxBookableDateISO();

  useEffect(() => {
    if (start) setMonth(start.slice(0, 7));
  }, [start]);

  useEffect(() => {
    if (!open) {
      setHoverDate('');
      setPickingEnd(Boolean(start && !end));
      return undefined;
    }
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
  }, [open, start, end]);

  const openPicker = () => setOpen(true);

  const handleDateClick = (iso) => {
    if (!start || (start && end) || compareISO(iso, start) < 0) {
      onChange?.({ start: iso, end: '' });
      setPickingEnd(true);
      return;
    }
    if (pickingEnd || (start && !end)) {
      if (compareISO(iso, start) <= 0) {
        onChange?.({ start: iso, end: '' });
        setPickingEnd(true);
        return;
      }
      onChange?.({ start, end: iso });
      setOpen(false);
      setPickingEnd(false);
    }
  };

  const clearDates = (e) => {
    e.stopPropagation();
    onChange?.({ start: '', end: '' });
    setPickingEnd(false);
  };

  const popover = open ? (
    <div className="date-picker__popover date-picker__popover--range" role="dialog" aria-label="Choose dates">
      <div className="date-range-picker__hint">
        {start && !end ? 'Select checkout date' : 'Select check-in date'}
      </div>
      <Calendar
        month={month}
        onMonthChange={setMonth}
        selectedStart={start}
        selectedEnd={end}
        hoverDate={hoverDate}
        onDateHover={setHoverDate}
        onDateClick={handleDateClick}
        minDate={minDate}
        maxDate={maxDate}
        monthsToShow={monthsToShow}
      />
      {(start || end) && (
        <div className="date-range-picker__footer">
          <button type="button" className="date-range-picker__clear" onClick={clearDates}>
            Clear dates
          </button>
        </div>
      )}
    </div>
  ) : null;

  if (variant === 'search') {
    return (
      <div className="date-range-picker date-range-picker--search-wrap" ref={rootRef}>
        <div className="search-pill__segment">
          <span className="search-pill__label">{startLabel}</span>
          <button
            type="button"
            className="date-picker__trigger date-picker__trigger--search"
            onClick={openPicker}
            aria-expanded={open}
          >
            <CalendarIcon size={14} className="date-picker__icon" aria-hidden />
            <span className="search-pill__value">{start ? formatDisplayDate(start, { short: true }) : 'Add date'}</span>
          </button>
        </div>
        <span className="search-pill__divider" />
        <div className="search-pill__segment">
          <span className="search-pill__label">{endLabel}</span>
          <button
            type="button"
            className="date-picker__trigger date-picker__trigger--search"
            onClick={openPicker}
            aria-expanded={open}
          >
            <CalendarIcon size={14} className="date-picker__icon" aria-hidden />
            <span className="search-pill__value">{end ? formatDisplayDate(end, { short: true }) : 'Add date'}</span>
          </button>
        </div>
        {popover}
      </div>
    );
  }

  if (variant === 'booking') {
    return (
      <div className={`date-range-picker date-range-picker--booking ${open ? 'date-picker--open' : ''} ${className}`} ref={rootRef}>
        <button type="button" className="date-range-picker__booking-field" onClick={openPicker} aria-expanded={open}>
          <span className="booking-widget__label">{startLabel}</span>
          <span className="date-range-picker__booking-value">{start ? formatDisplayDate(start, { short: true }) : 'Add date'}</span>
        </button>
        <button type="button" className="date-range-picker__booking-field" onClick={openPicker} aria-expanded={open}>
          <span className="booking-widget__label">{endLabel}</span>
          <span className="date-range-picker__booking-value">{end ? formatDisplayDate(end, { short: true }) : 'Add date'}</span>
        </button>
        {popover}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`date-picker date-range-picker date-range-picker--compact ${open ? 'date-picker--open' : ''}`} ref={rootRef}>
        <button type="button" className="search-pill__segment" onClick={openPicker} aria-expanded={open}>
          <span className="search-pill__label">Dates</span>
          <span className="search-pill__value">{formatRangeLabel(start, end)}</span>
        </button>
        {popover}
      </div>
    );
  }

  return (
    <div className={`date-range-picker date-range-picker--input ${open ? 'date-picker--open' : ''} ${className}`} ref={rootRef}>
      <div className="date-range-picker__fields">
        <div className="form-group">
          <label className="label" htmlFor={`${autoId}-start`}>{startLabel}</label>
          <button id={`${autoId}-start`} type="button" className="date-picker__trigger date-picker__trigger--input" onClick={openPicker}>
            <CalendarIcon size={18} className="date-picker__icon" aria-hidden />
            <span className="date-picker__value">{start ? formatDisplayDate(start, { short: true }) : 'Add date'}</span>
          </button>
        </div>
        <div className="form-group">
          <label className="label" htmlFor={`${autoId}-end`}>{endLabel}</label>
          <button id={`${autoId}-end`} type="button" className="date-picker__trigger date-picker__trigger--input" onClick={openPicker}>
            <CalendarIcon size={18} className="date-picker__icon" aria-hidden />
            <span className="date-picker__value">{end ? formatDisplayDate(end, { short: true }) : 'Add date'}</span>
          </button>
        </div>
      </div>
      {popover}
    </div>
  );
}
