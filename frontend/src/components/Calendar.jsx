import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  compareISO,
  daysInMonth,
  isBetweenISO,
  isDateDisabled,
  parseISODate,
  toISODate,
  minBookableMonthISO,
  maxBookableMonthISO,
  canNavigateToPrevMonth,
  canNavigateToNextMonth,
} from '../utils/dates';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function MonthGrid({
  year,
  month,
  selectedStart,
  selectedEnd,
  hoverDate,
  minDate,
  maxDate,
  onDateClick,
  onDateHover,
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(<div key={`empty-${i}`} className="calendar__day calendar__day--empty" />);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const iso = toISODate(new Date(year, month, day));
    const dayOfWeek = new Date(year, month, day).getDay();
    const isStart = selectedStart === iso;
    const isEnd = selectedEnd === iso;
    const isSingleDay = isStart && isEnd;
    const hasCompleteRange = Boolean(selectedStart && selectedEnd && selectedStart !== selectedEnd);
    const inRange = hasCompleteRange && isBetweenISO(iso, selectedStart, selectedEnd);
    const isHoverRange = Boolean(
      selectedStart && !selectedEnd && hoverDate
      && compareISO(iso, selectedStart) > 0
      && compareISO(iso, hoverDate) <= 0,
    );
    const isPreviewEnd = Boolean(
      selectedStart && !selectedEnd && hoverDate === iso
      && compareISO(iso, selectedStart) > 0,
    );
    const showRangeStart = !isSingleDay && isStart && Boolean(selectedEnd || hoverDate);
    const showRangeEnd = !isSingleDay && ((isEnd && selectedStart) || isPreviewEnd);
    const disabled = isDateDisabled(iso, minDate, maxDate);
    const isToday = iso === toISODate(new Date());

    cells.push(
      <button
        key={iso}
        type="button"
        className={[
          'calendar__day',
          isStart && 'calendar__day--start',
          isEnd && 'calendar__day--end',
          (inRange || isHoverRange) && 'calendar__day--in-range',
          showRangeStart && 'calendar__day--range-edge-start',
          showRangeEnd && 'calendar__day--range-edge-end',
          isPreviewEnd && 'calendar__day--preview-end',
          (isStart || isEnd) && 'calendar__day--selected',
          dayOfWeek === 0 && 'calendar__day--week-start',
          dayOfWeek === 6 && 'calendar__day--week-end',
          isToday && 'calendar__day--today',
          disabled && 'calendar__day--disabled',
        ].filter(Boolean).join(' ')}
        disabled={disabled}
        onClick={() => onDateClick(iso)}
        onMouseEnter={() => onDateHover?.(iso)}
        aria-label={iso}
        aria-pressed={isStart || isEnd}
      >
        <span>{day}</span>
      </button>,
    );
  }

  return (
    <div className="calendar__month">
      <div className="calendar__weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d} className="calendar__weekday">{d}</span>
        ))}
      </div>
      <div className="calendar__grid">{cells}</div>
    </div>
  );
}

export default function Calendar({
  month,
  onMonthChange,
  selectedStart,
  selectedEnd,
  onDateClick,
  minDate,
  maxDate,
  monthsToShow = 2,
  hoverDate,
  onDateHover,
  minMonth,
  maxMonth,
}) {
  const view = parseISODate(`${month}-01`) || new Date();
  const year = view.getFullYear();
  const monthIndex = view.getMonth();

  const prevMonth = () => {
    const d = new Date(year, monthIndex - 1, 1);
    onMonthChange(toISODate(d).slice(0, 7));
  };

  const nextMonth = () => {
    const d = new Date(year, monthIndex + 1, 1);
    onMonthChange(toISODate(d).slice(0, 7));
  };

  const monthLabel = (y, m) => new Date(y, m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const months = [];
  for (let i = 0; i < monthsToShow; i += 1) {
    const d = new Date(year, monthIndex + i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  const navMinMonth = minMonth ?? minBookableMonthISO();
  const navMaxMonth = maxMonth ?? maxBookableMonthISO();
  const canPrev = canNavigateToPrevMonth(month, navMinMonth);
  const canNext = canNavigateToNextMonth(month, monthsToShow, navMaxMonth);

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button
          type="button"
          className={`calendar__nav${canPrev ? '' : ' calendar__nav--disabled'}`}
          onClick={canPrev ? prevMonth : undefined}
          disabled={!canPrev}
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="calendar__titles">
          {months.map(({ year: y, month: m }) => (
            <span key={`${y}-${m}`} className="calendar__title">{monthLabel(y, m)}</span>
          ))}
        </div>
        <button
          type="button"
          className={`calendar__nav${canNext ? '' : ' calendar__nav--disabled'}`}
          onClick={canNext ? nextMonth : undefined}
          disabled={!canNext}
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className={`calendar__months calendar__months--${monthsToShow}`}>
        {months.map(({ year: y, month: m }) => (
          <MonthGrid
            key={`${y}-${m}`}
            year={y}
            month={m}
            selectedStart={selectedStart}
            selectedEnd={selectedEnd}
            hoverDate={hoverDate}
            minDate={minDate}
            maxDate={maxDate}
            onDateClick={onDateClick}
            onDateHover={onDateHover}
          />
        ))}
      </div>
    </div>
  );
}
