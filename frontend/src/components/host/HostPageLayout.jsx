import { Icon, ICON } from '../ui/Icon';

export function HostPage({ children, className = '' }) {
  return <div className={`host-page host-ui ${className}`.trim()}>{children}</div>;
}

export function HostHero({ title, subtitle, pills = [], actions }) {
  return (
    <header className="host-dashboard__hero">
      <div className="host-dashboard__hero-text">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {(pills.length > 0 || actions) && (
        <div className="host-dashboard__hero-meta">
          {pills.map((pill) => (
            <span key={pill} className="host-dashboard__hero-pill">{pill}</span>
          ))}
          {actions}
        </div>
      )}
    </header>
  );
}

export function HostKpiGrid({ children }) {
  return <div className="host-dashboard__kpis">{children}</div>;
}

const KPI_VARIANTS = {
  earnings: 'host-dashboard__kpi-icon--earnings',
  bookings: 'host-dashboard__kpi-icon--bookings',
  occupancy: 'host-dashboard__kpi-icon--occupancy',
  rating: 'host-dashboard__kpi-icon--rating',
};

export function HostKpi({ icon, variant = 'earnings', label, value, hint }) {
  return (
    <article className="host-dashboard__kpi">
      <div className={`host-dashboard__kpi-icon ${KPI_VARIANTS[variant] || KPI_VARIANTS.earnings}`}>
        <Icon icon={icon} size={ICON.md} />
      </div>
      <div>
        <div className="host-dashboard__kpi-label">{label}</div>
        <div className="host-dashboard__kpi-value">{value}</div>
        {hint && <div className="host-dashboard__kpi-hint">{hint}</div>}
      </div>
    </article>
  );
}

export function HostPanel({ title, subtitle, actions, children, id, className = '' }) {
  return (
    <section id={id} className={`host-dashboard__panel ${className}`.trim()}>
      {(title || actions) && (
        <div className="host-dashboard__panel-head">
          {title && (typeof title === 'string' ? <h2>{title}</h2> : title)}
          {subtitle && <span>{subtitle}</span>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function HostTabs({ tabs, active, onChange }) {
  return (
    <div className="host-ui-tabs" role="tablist">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          className={`host-ui-tabs__tab${active === id ? ' host-ui-tabs__tab--active' : ''}`}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function HostEmpty({ title, description, action }) {
  return (
    <div className="host-dashboard__empty">
      {title && <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>{title}</h3>}
      {description && <p style={{ margin: '0 0 1rem' }}>{description}</p>}
      {action}
    </div>
  );
}

export function HostList({ children }) {
  return <div className="host-dashboard__rank-list">{children}</div>;
}

export function HostListItem({ rank, title, meta, value, badge, onClick, as: Tag = 'article' }) {
  const props = onClick ? { onClick, role: 'button', tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && onClick() } : {};
  return (
    <Tag className={`host-dashboard__rank-item${onClick ? ' host-dashboard__rank-item--clickable' : ''}`} {...props}>
      {rank != null && <span className="host-dashboard__rank-num">{rank}</span>}
      <div>
        <div className="host-dashboard__rank-title">{title}</div>
        {meta && <div className="host-dashboard__rank-meta">{meta}</div>}
      </div>
      <div className="host-dashboard__rank-stat">
        {value}
        {badge}
      </div>
    </Tag>
  );
}
