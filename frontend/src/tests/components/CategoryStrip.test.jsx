import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FilterBar from '../../components/FilterBar';
import { ROOM_CATEGORIES } from '../../constants/roomCategories';

function renderStrip(initial = '/') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <FilterBar />
    </MemoryRouter>,
  );
}

describe('CategoryStrip', () => {
  it('renders all room categories with icons', () => {
    renderStrip();
    ROOM_CATEGORIES.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('selecting a category sets type query param', () => {
    renderStrip();
    fireEvent.click(screen.getByTestId('category-Suite'));
    expect(screen.getByTestId('category-Suite')).toHaveAttribute('aria-pressed', 'true');
  });

  it('highlights active category from URL', () => {
    renderStrip('/?type=Double');
    expect(screen.getByTestId('category-Double')).toHaveAttribute('aria-pressed', 'true');
  });
});
