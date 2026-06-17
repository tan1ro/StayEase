import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StarRating from '../../components/StarRating';

describe('StarRating', () => {
  it('renders 5 stars', () => {
    render(<StarRating value={3} readonly />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('readonly mode shows correct filled stars', () => {
    render(<StarRating value={4} readonly />);
    const stars = screen.getAllByRole('button');
    expect(stars[3].className).toContain('star-rating__star--filled');
  });

  it('interactive mode updates on click', () => {
    const onChange = vi.fn();
    render(<StarRating value={2} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('star-4'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('half-star renders for 0.5 values', () => {
    render(<StarRating value={2.5} readonly />);
    expect(screen.getByTestId('star-3').className).toContain('star-rating__star--half');
  });
});
