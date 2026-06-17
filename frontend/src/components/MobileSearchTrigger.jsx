import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getMobileSearchSummary } from '../utils/searchState';

export default function MobileSearchTrigger({ onOpen }) {
  const [searchParams] = useSearchParams();
  const summary = getMobileSearchSummary(searchParams);
  const hasQuery = summary !== 'Start your search';

  return (
    <button
      type="button"
      className={`mobile-search-trigger${hasQuery ? ' mobile-search-trigger--active' : ''}`}
      onClick={onOpen}
      data-testid="mobile-search-trigger"
    >
      <span className="mobile-search-trigger__icon">
        <Search size={18} />
      </span>
      <span className="mobile-search-trigger__text">{summary}</span>
    </button>
  );
}
