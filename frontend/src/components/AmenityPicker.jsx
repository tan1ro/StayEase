import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import AmenityIcon from './AmenityIcon';
import { AMENITY_CATEGORIES } from '../constants/amenities';

export default function AmenityPicker({ selected = [], onChange }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(AMENITY_CATEGORIES.map((cat) => [cat.id, cat.id === 'internet-connectivity' || cat.id === 'room-amenities'])),
  );

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AMENITY_CATEGORIES;
    return AMENITY_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.toLowerCase().includes(q)),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  const toggle = (name) => {
    if (selected.includes(name)) {
      onChange(selected.filter((x) => x !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  const toggleCategory = (catId) => {
    setExpanded((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const expandAll = () => {
    setExpanded(Object.fromEntries(AMENITY_CATEGORIES.map((cat) => [cat.id, true])));
  };

  const collapseAll = () => {
    setExpanded(Object.fromEntries(AMENITY_CATEGORIES.map((cat) => [cat.id, false])));
  };

  return (
    <div className="amenity-picker">
      <div className="amenity-picker__toolbar">
        <div className="amenity-picker__search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            className="input"
            placeholder="Search amenities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search amenities"
          />
        </div>
        <div className="amenity-picker__meta">
          <span className="amenity-picker__count">{selected.length} selected</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={expandAll}>Expand all</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={collapseAll}>Collapse all</button>
        </div>
      </div>

      <div className="amenity-picker__categories">
        {filteredCategories.map((cat) => {
          const selectedInCat = cat.items.filter((item) => selected.includes(item)).length;
          const isOpen = expanded[cat.id] ?? false;

          return (
            <section key={cat.id} className="amenity-picker__category">
              <button
                type="button"
                className="amenity-picker__category-header"
                onClick={() => toggleCategory(cat.id)}
                aria-expanded={isOpen}
              >
                <span>
                  <strong>{cat.label}</strong>
                  {selectedInCat > 0 && (
                    <span className="amenity-picker__category-badge">{selectedInCat}</span>
                  )}
                </span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isOpen && (
                <div className="amenity-picker__grid">
                  {cat.items.map((item) => (
                    <label key={item} className={`amenity-picker__item ${selected.includes(item) ? 'amenity-picker__item--selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selected.includes(item)}
                        onChange={() => toggle(item)}
                      />
                      <AmenityIcon name={item} showLabel />
                    </label>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <p className="amenity-picker__empty">No amenities match your search.</p>
      )}
    </div>
  );
}
