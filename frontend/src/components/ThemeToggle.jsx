import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Icon, ICON } from './ui/Icon';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Icon icon={isDark ? Sun : Moon} size={ICON.lg} />
    </button>
  );
}
