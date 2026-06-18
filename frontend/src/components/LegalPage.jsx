import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const RELATED_LINKS = [
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/cookie-policy', label: 'Cookie Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/help/cancellation', label: 'Cancellation options' },
  { to: '/help/billing-gst', label: 'Billing & GST' },
  { to: '/help/invoices', label: 'Invoices & receipts' },
  { to: '/help/tourist-guidelines', label: 'Tourist guidelines' },
  { to: '/help/host-guidelines', label: 'Host guidelines' },
  { to: '/help/hosting-responsibly', label: 'Hosting responsibly' },
  { to: '/help/local-laws', label: 'Local laws & taxes' },
  { to: '/help/nondiscrimination', label: 'Nondiscrimination Policy' },
  { to: '/help/service-fees', label: 'Service fees' },
];

export default function LegalPage({ title, updated, sections, children }) {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return undefined;
    const id = hash.replace('#', '');
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hash, title]);

  return (
    <div className="legal-page">
      <aside className="legal-toc hide-mobile">
        <h3>Contents</h3>
        <nav>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>{s.title}</a>
          ))}
        </nav>
        <div className="legal-toc__links">
          {RELATED_LINKS.map(({ to, label }) => (
            <Link key={to} to={to}>{label}</Link>
          ))}
        </div>
      </aside>
      <article className="legal-content">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">Last updated: {updated}</p>
        {sections.map((s) => (
          <section key={s.id} id={s.id}>
            <h2>{s.title}</h2>
            {s.paragraphs?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {s.list && (
              <ul>
                {s.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        {children}
      </article>
    </div>
  );
}
