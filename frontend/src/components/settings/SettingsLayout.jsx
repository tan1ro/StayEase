import { Link } from 'react-router-dom';
import { Icon, ICON } from '../ui/Icon';

function SettingsRouteLink({ to, className, children, onClick }) {
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {children}
      </button>
    );
  }
  if (to && (to.startsWith('/') || to.startsWith('#'))) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={to} className={className}>
      {children}
    </a>
  );
}

export function SettingsLayout({ title = 'Account settings', sections, activeId, onSelect, onDone, children }) {
  const mainSections = sections.filter((s) => !s.footer);
  const footerSections = sections.filter((s) => s.footer);

  return (
    <div className="account-settings">
      {onDone && (
        <div className="account-settings__topbar">
          <button type="button" className="account-settings__done" onClick={onDone}>
            Done
          </button>
        </div>
      )}
      <aside className="account-settings__nav">
        <h2 className="account-settings__nav-title">{title}</h2>
        <nav className="account-settings__nav-list" aria-label="Account settings">
          {mainSections.map(({ id, label, icon, badge }) => {
            const active = id === activeId;
            return (
              <button
                key={id}
                type="button"
                className={`account-settings__nav-item${active ? ' account-settings__nav-item--active' : ''}`}
                onClick={() => onSelect(id)}
              >
                {icon && <Icon icon={icon} size={ICON.md} className="account-settings__nav-icon" />}
                <span className="account-settings__nav-label">{label}</span>
                {badge && <span className="account-settings__badge">{badge}</span>}
              </button>
            );
          })}
          {footerSections.length > 0 && <hr className="account-settings__nav-divider" />}
          {footerSections.map(({ id, label, icon }) => {
            const active = id === activeId;
            return (
              <button
                key={id}
                type="button"
                className={`account-settings__nav-item${active ? ' account-settings__nav-item--active' : ''}`}
                onClick={() => onSelect(id)}
              >
                {icon && <Icon icon={icon} size={ICON.md} className="account-settings__nav-icon" />}
                <span className="account-settings__nav-label">{label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="account-settings__main">{children}</main>
    </div>
  );
}

export function SettingsPanel({ title, subtitle, tabs, activeTab, onTabChange, children }) {
  return (
    <div className="account-settings__panel">
      <header className="account-settings__panel-header">
        <h1>{title}</h1>
        {subtitle && <p className="account-settings__panel-subtitle">{subtitle}</p>}
      </header>
      {tabs?.length > 0 && (
        <div className="account-settings__tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={tab === activeTab}
              className={`account-settings__tab${tab === activeTab ? ' account-settings__tab--active' : ''}`}
              onClick={() => onTabChange?.(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      <div className="account-settings__panel-body">{children}</div>
    </div>
  );
}

export function SettingsSection({ title, description, children, footer }) {
  const hasRows = children && (Array.isArray(children) ? children.some(Boolean) : true);

  return (
    <section className="account-settings__section">
      {title && <h2 className="account-settings__section-title">{title}</h2>}
      {description && <p className="account-settings__section-desc">{description}</p>}
      {hasRows && <div className="account-settings__rows">{children}</div>}
      {footer && <div className="account-settings__section-footer">{footer}</div>}
    </section>
  );
}

export function SettingsRow({ label, value, description, action, onAction, to, children }) {
  const actionEl = action && (
    onAction ? (
      <button type="button" className="account-settings__action" onClick={onAction}>
        {action}
      </button>
    ) : to ? (
      <SettingsRouteLink to={to} className="account-settings__action">{action}</SettingsRouteLink>
    ) : (
      <span className="account-settings__action account-settings__action--static">{action}</span>
    )
  );

  const rowClass = `account-settings__row${description ? ' account-settings__row--described' : ''}`;

  return (
    <div className={rowClass}>
      <div className="account-settings__row-main">
        <span className="account-settings__row-label">{label}</span>
        {description && <p className="account-settings__row-desc">{description}</p>}
        {value != null && value !== '' && (
          <span className="account-settings__row-value">{value}</span>
        )}
        {children}
      </div>
      {actionEl && <div className="account-settings__row-action">{actionEl}</div>}
    </div>
  );
}

export function SettingsLinkRow({ label, description, to, onClick }) {
  const inner = (
    <>
      <div className="account-settings__row-main">
        <span className="account-settings__row-label">{label}</span>
        {description && <p className="account-settings__row-desc">{description}</p>}
      </div>
      <div className="account-settings__row-action">
        <span className="account-settings__chevron" aria-hidden="true">›</span>
      </div>
    </>
  );

  if (to) {
    return (
      <SettingsRouteLink to={to} className="account-settings__row account-settings__row--link">
        {inner}
      </SettingsRouteLink>
    );
  }

  return (
    <button type="button" className="account-settings__row account-settings__row--link" onClick={onClick}>
      {inner}
    </button>
  );
}

export function SettingsToggleRow({ label, description, checked, onChange, disabled }) {
  return (
    <div className={`account-settings__row account-settings__row--toggle${description ? ' account-settings__row--described' : ''}`}>
      <div className="account-settings__row-main">
        <span className="account-settings__row-label">{label}</span>
        {description && <p className="account-settings__row-desc">{description}</p>}
      </div>
      <div className="account-settings__row-action">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          className={`account-settings__switch${checked ? ' account-settings__switch--on' : ''}`}
          onClick={() => onChange?.(!checked)}
        >
          <span className="account-settings__switch-thumb" />
        </button>
      </div>
    </div>
  );
}

export function SettingsCta({ children, onClick, to, variant = 'primary' }) {
  if (to) {
    return (
      <SettingsRouteLink to={to} className={`account-settings__cta account-settings__cta--${variant}`}>
        {children}
      </SettingsRouteLink>
    );
  }
  return (
    <button type="button" className={`account-settings__cta account-settings__cta--${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function SettingsInfoBox({ items }) {
  return (
    <div className="account-settings__info-box">
      {items.map(({ icon, title, text }) => (
        <div key={title} className="account-settings__info-item">
          {icon && <Icon icon={icon} size={ICON.lg} className="account-settings__info-icon" />}
          <div>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SettingsRequirements({ title, description, items }) {
  const done = items.filter((item) => item.done).length;
  const complete = done === items.length;

  return (
    <section className={`account-settings__requirements${complete ? ' account-settings__requirements--complete' : ''}`}>
      <div className="account-settings__requirements-head">
        <div>
          <h2 className="account-settings__requirements-title">{title}</h2>
          {description && <p className="account-settings__requirements-desc">{description}</p>}
        </div>
        <span className="account-settings__requirements-count">{done}/{items.length}</span>
      </div>
      <ul className="account-settings__requirements-list">
        {items.map(({ id, label, done: itemDone, action, onAction }) => (
          <li key={id} className={`account-settings__requirements-item${itemDone ? ' account-settings__requirements-item--done' : ''}`}>
            <span className="account-settings__requirements-check" aria-hidden="true">{itemDone ? '✓' : '○'}</span>
            <span className="account-settings__requirements-label">{label}</span>
            {!itemDone && action && onAction && (
              <button type="button" className="account-settings__action" onClick={onAction}>{action}</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SettingsUrlField({ prefix, value, onChange, onSave, saveLabel = 'Save' }) {
  return (
    <div className="account-settings__url-field">
      <span className="account-settings__url-prefix">{prefix}</span>
      <input className="input account-settings__url-input" value={value} onChange={onChange} />
      <button type="button" className="btn btn-primary btn-sm" onClick={onSave}>{saveLabel}</button>
    </div>
  );
}

export function SettingsFeatureCard({ icon, title, description, action }) {
  return (
    <div className="account-settings__feature-card">
      {icon && <div className="account-settings__feature-icon" aria-hidden="true">{icon}</div>}
      <div className="account-settings__feature-body">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
        {action}
      </div>
    </div>
  );
}
