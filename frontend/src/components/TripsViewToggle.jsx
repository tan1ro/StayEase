import { LayoutGrid, List } from 'lucide-react';
import { Icon, ICON } from './ui/Icon';

const VIEWS = [
  { id: 'list', label: 'List', icon: List },
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
];

export default function TripsViewToggle({ value, onChange }) {
  return (
    <div className="trips-view-toggle" role="group" aria-label="Trip layout">
      {VIEWS.map(({ id, label, icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            className={`trips-view-toggle__btn${active ? ' trips-view-toggle__btn--active' : ''}`}
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={() => onChange(id)}
          >
            <Icon icon={icon} size={ICON.sm} />
            <span className="trips-view-toggle__label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
