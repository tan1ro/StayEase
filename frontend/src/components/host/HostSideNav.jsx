import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Icon, ICON } from '../ui/Icon';

export default function HostSideNav({ title, items, activeId }) {
  return (
    <aside className="host-sidenav">
      {title && <h2 className="host-sidenav__title">{title}</h2>}
      <nav className="host-sidenav__nav">
        {items.map(({ id, label, sub, to, onClick, dot }) => {
          const active = id === activeId;
          const className = `host-sidenav__item ${active ? 'host-sidenav__item--active' : ''}`;
          const content = (
            <>
              <div>
                <strong>{label}</strong>
                {sub && <span>{sub}</span>}
              </div>
              {dot && <span className="host-sidenav__dot" />}
              <Icon icon={ChevronRight} size={ICON.sm} />
            </>
          );
          if (to) {
            return (
              <Link key={id} to={to} className={className}>
                {content}
              </Link>
            );
          }
          return (
            <button key={id} type="button" className={className} onClick={() => onClick?.(id)}>
              {content}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
