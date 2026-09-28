// Dark is the default. The choice is remembered per browser; if storage is
// blocked (private window) the toggle still works for the current page.
// index.html and login.html apply the saved theme inline before first paint,
// so there is no dark→light flash.

export type Theme = 'dark' | 'light';

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: Theme) {
  if (theme === 'light') document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;
  try { localStorage.setItem('sl-theme', theme); } catch { /* blocked: this page only */ }
}
