import { useId } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon, ICON } from './ui/Icon';

export default function HorizontalScrollSection({
  title,
  children,
  footer,
  className = '',
  itemClassName = 'horizontal-scroll__item',
}) {
  const scrollId = useId().replace(/:/g, '');

  const scroll = (dir) => {
    const el = document.getElementById(scrollId);
    if (el) el.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <section className={`horizontal-scroll ${className}`.trim()}>
      <div className="horizontal-scroll__header">
        <h2 className="horizontal-scroll__title">{title}</h2>
        <div className="horizontal-scroll__nav hide-mobile">
          <button type="button" onClick={() => scroll(-1)} aria-label="Scroll left">
            <Icon icon={ChevronLeft} size={ICON.md} />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Scroll right">
            <Icon icon={ChevronRight} size={ICON.md} />
          </button>
        </div>
      </div>
      <div className="horizontal-scroll__track" id={scrollId}>
        {Array.isArray(children)
          ? children.map((child, index) => (
            <div key={child?.key ?? index} className={itemClassName}>
              {child}
            </div>
          ))
          : children}
      </div>
      {footer}
    </section>
  );
}
