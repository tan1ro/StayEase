export const THEME_STORAGE_KEY = 'stayease-theme';

export const themes = {
  light: 'light',
  dark: 'dark',
};

export function getStoredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === themes.dark || stored === themes.light) {
    return stored;
  }
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return themes.dark;
  }
  return themes.light;
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === themes.dark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'StayEase';
