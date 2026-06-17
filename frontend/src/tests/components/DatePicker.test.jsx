import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DatePicker from '../../components/DatePicker';
import DateRangePicker from '../../components/DateRangePicker';
import { formatDisplayDate, todayISO } from '../../utils/dates';

describe('DatePicker', () => {
  it('opens calendar popover on click', () => {
    render(<DatePicker label="Check-in" value="" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /check-in/i }));
    expect(screen.getByRole('dialog', { name: 'Check-in' })).toBeInTheDocument();
  });

  it('shows formatted selected date', () => {
    const iso = todayISO();
    render(<DatePicker label="Date" value={iso} onChange={vi.fn()} />);
    expect(screen.getByText(formatDisplayDate(iso, { short: true }))).toBeInTheDocument();
  });
});

describe('DateRangePicker', () => {
  it('renders compact variant label', () => {
    render(
      <DateRangePicker variant="compact" start="" end="" onChange={vi.fn()} />,
    );
    expect(screen.getByText('Dates')).toBeInTheDocument();
    expect(screen.getByText('Add dates')).toBeInTheDocument();
  });
});
