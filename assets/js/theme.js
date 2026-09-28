// Dark is the default. The choice is remembered per browser; if storage is
// blocked (private window) the toggle still works for the current page.
(() => {
  const root = document.documentElement;
  const btn = document.getElementById('themeBtn');
  const sun = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const moon = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function paint() {
    const light = root.dataset.theme === 'light';
    btn.innerHTML = light ? moon : sun;
    btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    btn.title = btn.getAttribute('aria-label');
  }

  btn.addEventListener('click', () => {
    const light = root.dataset.theme !== 'light';
    if (light) root.dataset.theme = 'light'; else delete root.dataset.theme;
    try { localStorage.setItem('sl-theme', light ? 'light' : 'dark'); } catch (e) { /* storage blocked: theme lasts for this page only */ }
    paint();
  });
  paint();
})();
