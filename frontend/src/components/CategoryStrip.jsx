import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ROOM_CATEGORIES } from '../constants/roomCategories';
import { filtersFromParams, paramsFromFilters } from './FilterBar';
import { Icon, ICON } from './ui/Icon';

export default function CategoryStrip() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const activeType = filters.type.length === 1 ? filters.type[0] : '';

  const selectCategory = useCallback(
    (value) => {
      const next = {
        ...filters,
        type: activeType === value ? [] : [value],
      };
      setSearchParams(paramsFromFilters(next));
    },
    [filters, activeType, setSearchParams],
  );

  return (
    <nav className="category-strip" aria-label="Filter by room category">
      {ROOM_CATEGORIES.map(({ value, label, icon: CategoryIcon }) => {
        const isActive = activeType === value;
        return (
          <button
            key={value}
            type="button"
            className={`category-strip__item ${isActive ? 'category-strip__item--active' : ''}`}
            onClick={() => selectCategory(value)}
            aria-pressed={isActive}
            data-testid={`category-${value}`}
          >
            <Icon icon={CategoryIcon} size={ICON.md} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
