import { createContext, useCallback, useContext, useState } from 'react';
import MobileSearchModal from './MobileSearchModal';

const SearchModalContext = createContext(null);

export function SearchModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  return (
    <SearchModalContext.Provider value={{ open, openSearch, closeSearch }}>
      {children}
      <MobileSearchModal open={open} onClose={closeSearch} />
    </SearchModalContext.Provider>
  );
}

export function useSearchModal() {
  const ctx = useContext(SearchModalContext);
  if (!ctx) {
    throw new Error('useSearchModal must be used within SearchModalProvider');
  }
  return ctx;
}
