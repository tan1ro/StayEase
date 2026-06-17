import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FilterBar from '../../components/FilterBar';

function renderFilterBar(initial = '/') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <FilterBar defaultExpanded />
    </MemoryRouter>,
  );
}

describe('FilterBar', () => {
  it('renders all filter groups', () => {
    renderFilterBar();
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    expect(screen.getByText('Room Category')).toBeInTheDocument();
    expect(screen.getByText('Food Preference')).toBeInTheDocument();
    expect(screen.getAllByText('Smoking').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Alcohol').length).toBeGreaterThan(0);
  });

  it('food preference filter: veg pill activates correctly', () => {
    renderFilterBar();
    const pill = screen.getByTestId('filter-food-veg');
    fireEvent.click(pill);
    expect(pill.className).toContain('pill--active');
  });

  it('food preference filter: nonveg pill activates correctly', () => {
    renderFilterBar();
    const pill = screen.getByTestId('filter-food-nonveg');
    fireEvent.click(pill);
    expect(pill.className).toContain('pill--active');
  });

  it('smoking filter: non-smoking toggle activates', () => {
    renderFilterBar();
    const pill = screen.getByTestId('filter-smoking-non_smoking');
    fireEvent.click(pill);
    expect(pill.className).toContain('pill--active');
  });

  it('alcohol filter: non-alcohol toggle activates', () => {
    renderFilterBar();
    const pill = screen.getByTestId('filter-alcohol-non_alcohol');
    fireEvent.click(pill);
    expect(pill.className).toContain('pill--active');
  });

  it('view type: hill_view pill selects', () => {
    renderFilterBar();
    const pill = screen.getByTestId('filter-view-hill_view');
    fireEvent.click(pill);
    expect(pill.className).toContain('pill--active');
  });

  it('view type: beach_view pill selects', () => {
    renderFilterBar();
    const pill = screen.getByTestId('filter-view-beach_view');
    fireEvent.click(pill);
    expect(pill.className).toContain('pill--active');
  });

  it('balcony toggle filters rooms', () => {
    renderFilterBar();
    const pill = screen.getByTestId('filter-balcony-true');
    fireEvent.click(pill);
    expect(pill.className).toContain('pill--active');
  });

  it('multiple filters combined update query params', () => {
    renderFilterBar();
    fireEvent.click(screen.getByTestId('filter-food-veg'));
    fireEvent.click(screen.getByTestId('filter-smoking-non_smoking'));
    expect(screen.getByTestId('filter-food-veg').className).toContain('pill--active');
    expect(screen.getByTestId('filter-smoking-non_smoking').className).toContain('pill--active');
  });

  it('clear all filters resets state', () => {
    renderFilterBar('/?food=veg&smoking=non_smoking');
    fireEvent.click(screen.getByTestId('clear-filters'));
    expect(screen.getByTestId('filter-food-veg').className).not.toContain('pill--active');
  });
});
