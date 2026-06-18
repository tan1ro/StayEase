import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  Beef,
  Building,
  ChevronDown,
  Cigarette,
  CigaretteOff,
  DoorOpen,
  Droplets,
  Leaf,
  Minus,
  Mountain,
  Plus,
  SlidersHorizontal,
  TreePine,
  UtensilsCrossed,
  Waves,
  Wine,
  WineOff,
  X,
} from 'lucide-react';
import { ROOM_CATEGORIES } from '../constants/roomCategories';
import { BEACH_SEA_VIEW_TYPES, isViewFilterActive, toggleViewFilter } from '../constants/roomPlacement';
import { Icon, ICON } from './ui/Icon';

const CATEGORIES = ROOM_CATEGORIES;

const FOOD_OPTIONS = [
  { value: 'veg', icon: Leaf, label: 'Veg Only' },
  { value: 'nonveg', icon: Beef, label: 'Non-Veg' },
  { value: 'both', icon: UtensilsCrossed, label: 'Both' },
];

const VIEW_OPTIONS = [
  { value: 'hill_view', icon: Mountain, label: 'Hill View' },
  { value: 'beach_view', icon: Waves, label: 'Beach & Sea View', matchValues: BEACH_SEA_VIEW_TYPES },
  { value: 'garden_view', icon: TreePine, label: 'Garden View' },
  { value: 'city_view', icon: Building, label: 'City View' },
  { value: 'pool_view', icon: Droplets, label: 'Pool View' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'top_rated', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
];

function parseList(val) {
  return val ? val.split(',').filter(Boolean) : [];
}

function toggleInList(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function filtersFromParams(searchParams) {
  return {
    type: parseList(searchParams.get('type')),
    food: parseList(searchParams.get('food')),
    smoking: searchParams.get('smoking') || '',
    alcohol: searchParams.get('alcohol') || '',
    view: parseList(searchParams.get('view')),
    balcony: searchParams.get('balcony') === 'true',
    min_price: searchParams.get('min_price') || '0',
    max_price: searchParams.get('max_price') || '50000',
    guests: searchParams.get('guests') || '1',
    check_in: searchParams.get('check_in') || '',
    check_out: searchParams.get('check_out') || '',
    sort: searchParams.get('sort') || '',
    city: searchParams.get('city') || '',
    search: searchParams.get('search') || '',
    nearby: searchParams.get('nearby') === 'true',
    lat: searchParams.get('lat') || '',
    lng: searchParams.get('lng') || '',
    radius_km: searchParams.get('radius_km') || '',
    available: searchParams.get('available') === 'true',
  };
}

export function paramsFromFilters(filters) {
  const params = {};
  if (filters.type?.length) params.type = filters.type.join(',');
  if (filters.food?.length) params.food = filters.food.join(',');
  if (filters.smoking) params.smoking = filters.smoking;
  if (filters.alcohol) params.alcohol = filters.alcohol;
  if (filters.view?.length) params.view = filters.view.join(',');
  if (filters.balcony) params.balcony = 'true';
  if (filters.min_price && filters.min_price !== '0') params.min_price = filters.min_price;
  if (filters.max_price && filters.max_price !== '50000') params.max_price = filters.max_price;
  if (filters.guests && filters.guests !== '1') params.guests = filters.guests;
  if (filters.check_in) params.check_in = filters.check_in;
  if (filters.check_out) params.check_out = filters.check_out;
  if (filters.sort) params.sort = filters.sort;
  if (filters.city) params.city = filters.city;
  if (filters.search) params.search = filters.search;
  if (filters.nearby) params.nearby = 'true';
  if (filters.lat) params.lat = filters.lat;
  if (filters.lng) params.lng = filters.lng;
  if (filters.radius_km) params.radius_km = filters.radius_km;
  if (filters.available) params.available = 'true';
  return params;
}

export function apiParamsFromFilters(filters) {
  const params = paramsFromFilters(filters);
  delete params.nearby;
  return params;
}

function activeFilterCount(filters) {
  let n = 0;
  if (filters.type.length) n++;
  if (filters.food.length) n++;
  if (filters.smoking) n++;
  if (filters.alcohol) n++;
  if (filters.view.length) n++;
  if (filters.balcony) n++;
  if (filters.max_price !== '50000') n++;
  if (filters.available) n++;
  return n;
}

export default function FilterBar({ onChange, defaultExpanded = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPanel, setShowPanel] = useState(defaultExpanded);
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const activeCount = activeFilterCount(filters);

  const updateFilters = useCallback(
    (patch) => {
      const next = { ...filters, ...patch };
      const params = paramsFromFilters(next);
      setSearchParams(params);
      onChange?.(apiParamsFromFilters(next));
    },
    [filters, setSearchParams, onChange],
  );

  const clearAll = () => {
    setSearchParams({});
    onChange?.({});
  };

  const activeType = filters.type.length === 1 ? filters.type[0] : '';

  const selectCategory = useCallback(
    (value) => {
      updateFilters({ type: activeType === value ? [] : [value] });
    },
    [activeType, updateFilters],
  );

  const sortLabel = SORT_OPTIONS.find((opt) => opt.value === filters.sort)?.label || 'Recommended';

  return (
    <div className="filter-shell">
      {/* Toolbar */}
      <div className="filter-toolbar">
        <button
          type="button"
          className={`filter-toolbar__btn filter-toolbar__side ${showPanel ? 'filter-toolbar__btn--active' : ''}`}
          onClick={() => setShowPanel((v) => !v)}
        >
          <Icon icon={SlidersHorizontal} size={ICON.sm} />
          Filters
          {activeCount > 0 && <span className="filter-toolbar__badge">{activeCount}</span>}
        </button>

        <nav className="filter-toolbar__categories" aria-label="Filter by room category">
          {CATEGORIES.map(({ value, icon: CategoryIcon, label }) => {
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

        <div className="filter-toolbar__sort filter-toolbar__side">
          <Icon icon={ArrowUpDown} size={ICON.sm} />
          <span className="filter-toolbar__sort-label">{sortLabel}</span>
          <select
            className="filter-toolbar__select"
            value={filters.sort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value || 'rec'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Icon icon={ChevronDown} size={ICON.sm} className="filter-toolbar__sort-chevron" />
        </div>

        {activeCount > 0 && (
          <button type="button" className="filter-toolbar__clear hide-mobile" onClick={clearAll} data-testid="clear-filters">
            Clear all
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showPanel && (
        <div className="filter-panel" data-testid="filter-bar">
          <div className="filter-panel__header">
            <h3>Filters</h3>
            <button type="button" className="filter-panel__close" onClick={() => setShowPanel(false)} aria-label="Close filters">
              <Icon icon={X} size={ICON.md} />
            </button>
          </div>
          <div className="filter-panel__grid">
            <div className="filter-panel__row filter-panel__row--quad">
              <div className="filter-group">
                <span className="filter-group__label">Room Category</span>
                <div className="filter-group__pills filter-group__pills--grid-2">
                  {CATEGORIES.map(({ value, icon: PillIcon, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`pill ${filters.type.includes(value) ? 'pill--active' : ''}`}
                      onClick={() => updateFilters({ type: toggleInList(filters.type, value) })}
                    >
                      <Icon icon={PillIcon} size={ICON.sm} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-group__label">Food Preference</span>
                <div className="filter-group__pills filter-group__pills--grid-2">
                  {FOOD_OPTIONS.map(({ value, icon: PillIcon, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`pill ${filters.food.includes(value) ? 'pill--active' : ''}`}
                      onClick={() => updateFilters({ food: toggleInList(filters.food, value) })}
                      data-testid={`filter-food-${value}`}
                    >
                      <Icon icon={PillIcon} size={ICON.sm} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-group__label">Smoking</span>
                <div className="filter-group__pills filter-group__pills--grid-2">
                  {[
                    { value: '', label: 'Any' },
                    { value: 'smoking', icon: Cigarette, label: 'Smoking' },
                    { value: 'non_smoking', icon: CigaretteOff, label: 'Non-Smoking' },
                  ].map(({ value, icon: PillIcon, label }) => (
                    <button
                      key={value || 'any'}
                      type="button"
                      className={`pill ${filters.smoking === value ? 'pill--active' : ''}`}
                      onClick={() => updateFilters({ smoking: value })}
                      data-testid={`filter-smoking-${value || 'any'}`}
                    >
                      {PillIcon ? <Icon icon={PillIcon} size={ICON.sm} /> : null} {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-group__label">Alcohol</span>
                <div className="filter-group__pills filter-group__pills--grid-2">
                  {[
                    { value: '', label: 'Any' },
                    { value: 'alcohol', icon: Wine, label: 'Alcohol' },
                    { value: 'non_alcohol', icon: WineOff, label: 'No Alcohol' },
                  ].map(({ value, icon: PillIcon, label }) => (
                    <button
                      key={value || 'any'}
                      type="button"
                      className={`pill ${filters.alcohol === value ? 'pill--active' : ''}`}
                      onClick={() => updateFilters({ alcohol: value })}
                      data-testid={`filter-alcohol-${value || 'any'}`}
                    >
                      {PillIcon ? <Icon icon={PillIcon} size={ICON.sm} /> : null} {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="filter-panel__row filter-panel__row--full">
              <div className="filter-group filter-group--full">
                <span className="filter-group__label">View Type</span>
                <div className="filter-group__pills filter-group__pills--grid-5">
                  {VIEW_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`pill ${isViewFilterActive(filters.view, option) ? 'pill--active' : ''}`}
                      onClick={() => updateFilters({ view: toggleViewFilter(filters.view, option) })}
                      data-testid={`filter-view-${option.value}`}
                    >
                      <Icon icon={option.icon} size={ICON.sm} /> {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="filter-panel__row filter-panel__row--quad">
              <div className="filter-group">
                <span className="filter-group__label">Balcony</span>
                <div className="filter-group__pills filter-group__pills--grid-2">
                  <button
                    type="button"
                    className={`pill ${!filters.balcony ? 'pill--active' : ''}`}
                    onClick={() => updateFilters({ balcony: false })}
                    data-testid="filter-balcony-any"
                  >
                    Any
                  </button>
                  <button
                    type="button"
                    className={`pill ${filters.balcony ? 'pill--active' : ''}`}
                    onClick={() => updateFilters({ balcony: true })}
                    data-testid="filter-balcony-true"
                  >
                    <Icon icon={DoorOpen} size={ICON.sm} /> With Balcony
                  </button>
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-group__label">Guests</span>
                <div className="filter-group__pills filter-group__pills--stepper">
                  <button type="button" className="pill" onClick={() => updateFilters({ guests: String(Math.max(1, Number(filters.guests) - 1)) })} aria-label="Decrease guests">
                    <Icon icon={Minus} size={ICON.sm} />
                  </button>
                  <span className="pill pill--active">{filters.guests}</span>
                  <button type="button" className="pill" onClick={() => updateFilters({ guests: String(Math.min(10, Number(filters.guests) + 1)) })} aria-label="Increase guests">
                    <Icon icon={Plus} size={ICON.sm} />
                  </button>
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-group__label">Price up to ₹{Number(filters.max_price).toLocaleString('en-IN')}</span>
                <div className="filter-group__control">
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="500"
                    value={filters.max_price}
                    onChange={(e) => updateFilters({ max_price: e.target.value })}
                    aria-label="Max price"
                    className="filter-range"
                  />
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-group__label">Availability</span>
                <div className="filter-group__pills filter-group__pills--single">
                  <button
                    type="button"
                    className={`pill ${filters.available ? 'pill--active' : ''}`}
                    onClick={() => updateFilters({ available: !filters.available })}
                  >
                    Available only
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
