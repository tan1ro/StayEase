export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Number of months ahead guests can book (2 years from the current month). */
export const BOOKING_CALENDAR_MONTHS = 24;

export function parseISODate(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISODate(new Date());
}

export function formatDisplayDate(value, { short = false } = {}) {
  const date = parseISODate(value);
  if (!date) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: short ? 'short' : 'long',
    year: short ? undefined : 'numeric',
  });
}

export function formatRangeLabel(start, end) {
  if (start && end) return `${formatDisplayDate(start, { short: true })} – ${formatDisplayDate(end, { short: true })}`;
  if (start) return `${formatDisplayDate(start, { short: true })} – Add checkout`;
  return 'Add dates';
}

export function compareISO(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function addDaysISO(value, days) {
  const date = parseISODate(value);
  if (!date) return '';
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function startOfMonthDate(year, month) {
  return new Date(year, month, 1);
}

export function isDateDisabled(iso, minDate, maxDate) {
  if (!iso) return true;
  if (minDate && compareISO(iso, minDate) < 0) return true;
  if (maxDate && compareISO(iso, maxDate) > 0) return true;
  return false;
}

export function isBetweenISO(iso, start, end) {
  if (!iso || !start || !end) return false;
  return compareISO(iso, start) > 0 && compareISO(iso, end) < 0;
}

export function maxBookableDateISO(monthsAhead = BOOKING_CALENDAR_MONTHS) {
  const now = new Date();
  return toISODate(new Date(now.getFullYear(), now.getMonth() + monthsAhead + 1, 0));
}

export function minBookableMonthISO() {
  const now = new Date();
  return toISODate(new Date(now.getFullYear(), now.getMonth(), 1)).slice(0, 7);
}

export function maxBookableMonthISO(monthsAhead = BOOKING_CALENDAR_MONTHS) {
  const now = new Date();
  return toISODate(new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1)).slice(0, 7);
}

export function minBirthDateISO() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 100);
  return toISODate(date);
}

export const MIN_SIGNUP_AGE = 18;

/** Latest birth date that still satisfies the minimum signup age. */
export function maxBirthDateISO(minAge = MIN_SIGNUP_AGE) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - minAge);
  return toISODate(date);
}

export function getBirthYearRange(minAge = MIN_SIGNUP_AGE) {
  const maxYear = new Date().getFullYear() - minAge;
  const minYear = new Date().getFullYear() - 100;
  const years = [];
  for (let year = maxYear; year >= minYear; year -= 1) years.push(year);
  return years;
}

export function isBirthMonthDisabled(year, monthIndex, minAge = MIN_SIGNUP_AGE) {
  const firstOfMonth = toISODate(new Date(year, monthIndex, 1));
  const lastOfMonth = toISODate(new Date(year, monthIndex, daysInMonth(year, monthIndex)));
  const minDate = minBirthDateISO();
  const maxDate = maxBirthDateISO(minAge);
  if (compareISO(lastOfMonth, minDate) < 0) return true;
  if (compareISO(firstOfMonth, maxDate) > 0) return true;
  return false;
}

export function isBirthDayDisabled(year, monthIndex, day, minAge = MIN_SIGNUP_AGE) {
  const iso = toISODate(new Date(year, monthIndex, day));
  return isDateDisabled(iso, minBirthDateISO(), maxBirthDateISO(minAge));
}

export function defaultBirthMonthISO() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 25);
  return toISODate(date).slice(0, 7);
}

export function canNavigateToPrevMonth(viewMonth, minMonth = minBookableMonthISO()) {
  return compareISO(`${viewMonth}-01`, `${minMonth}-01`) > 0;
}

export function canNavigateToNextMonth(viewMonth, monthsToShow = 1, maxMonth = maxBookableMonthISO()) {
  const [year, month] = viewMonth.split('-').map(Number);
  const lastShown = new Date(year, month - 1 + monthsToShow - 1, 1);
  const lastShownMonth = toISODate(lastShown).slice(0, 7);
  return compareISO(`${lastShownMonth}-01`, `${maxMonth}-01`) < 0;
}

export function isMonthInBookingWindow(year, month, monthsAhead = BOOKING_CALENDAR_MONTHS) {
  const now = new Date();
  const minYear = now.getFullYear();
  const minMonth = now.getMonth();
  const maxDate = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1);
  const maxYear = maxDate.getFullYear();
  const maxMonth = maxDate.getMonth();
  if (year < minYear || (year === minYear && month < minMonth)) return false;
  if (year > maxYear || (year === maxYear && month > maxMonth)) return false;
  return true;
}
