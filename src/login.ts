import './styles/theme.css';
import './styles/login.css';
import { currentTheme, setTheme } from './lib/theme';
import { SUN, MOON } from './lib/icons';

// Sign-in page: the form posts to /login, where the middleware checks the
// password. This script only paints the theme toggle and the error message.
const btn = document.getElementById('themeBtn') as HTMLButtonElement;
function paint() {
  const light = currentTheme() === 'light';
  btn.innerHTML = light ? MOON : SUN;
  btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  btn.title = btn.getAttribute('aria-label')!;
}
btn.addEventListener('click', () => { setTheme(currentTheme() === 'light' ? 'dark' : 'light'); paint(); });
paint();

if (new URLSearchParams(location.search).has('error')) document.getElementById('err')!.hidden = false;
