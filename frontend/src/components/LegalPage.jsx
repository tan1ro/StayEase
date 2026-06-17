import { Link } from 'react-router-dom';

export default function LegalPage({ title, updated, sections, children }) {
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
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </aside>
      <article className="legal-content">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">Last updated: {updated}</p>
        {children || sections.map((s) => (
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
      </article>
    </div>
  );
}
