import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookingGuestVerification, { defaultGuestVerification } from '../../components/BookingGuestVerification';

describe('BookingGuestVerification', () => {
  it('accepts a complete 12-digit Aadhar without showing a false error', () => {
    let state = defaultGuestVerification(null);
    const onChange = vi.fn((updater) => {
      state = typeof updater === 'function' ? updater(state) : updater;
    });

    const { rerender } = render(
      <BookingGuestVerification value={state} onChange={onChange} user={null} />,
    );

    const input = screen.getByLabelText(/ID number/i);
    fireEvent.change(input, { target: { value: '748384328492' } });
    rerender(<BookingGuestVerification value={state} onChange={onChange} user={null} />);

    expect(input).toHaveValue('7483 8432 8492');
    expect(screen.queryByText(/Aadhar must be exactly 12 digits/i)).not.toBeInTheDocument();
  });

  it('allows typing a PAN ID number without resetting the field', () => {
    let state = { ...defaultGuestVerification(null), idType: 'pan' };
    const onChange = vi.fn((updater) => {
      state = typeof updater === 'function' ? updater(state) : updater;
    });

    const { rerender } = render(
      <BookingGuestVerification value={state} onChange={onChange} user={null} />,
    );

    const input = screen.getByLabelText(/ID number/i);
    fireEvent.change(input, { target: { value: 'ABCDE' } });
    rerender(<BookingGuestVerification value={state} onChange={onChange} user={null} />);
    expect(input).toHaveValue('ABCDE');

    fireEvent.change(input, { target: { value: 'ABCDE1234F' } });
    rerender(<BookingGuestVerification value={state} onChange={onChange} user={null} />);
    expect(input).toHaveValue('ABCDE1234F');
  });
});
