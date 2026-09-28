// Sticky top bar: outline toggle (phones), logo, course title, live progress,
// theme toggle and sign-out. Sign-out is a plain link on purpose: /logout is
// served by the middleware and must clear the cookie with a full page load.
import { useState, useSyncExternalStore } from 'react';
import { ALL_LESSONS, COURSE_TITLE } from '../course';
import { MOON, SUN } from '../lib/icons';
import { Progress } from '../lib/progress';
import { currentTheme, setTheme, type Theme } from '../lib/theme';

interface Props {
  menuOpen: boolean;
  onMenu: () => void;
}

const MENU_ICON = (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
const LOGO_ICON = (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7" /></svg>
);
const LOGOUT_ICON = (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" /></svg>
);

export default function TopBar({ menuOpen, onMenu }: Props) {
  const done = useSyncExternalStore(Progress.subscribe, Progress.doneCount);
  const total = ALL_LESSONS.length;
  const [theme, setThemeState] = useState<Theme>(currentTheme);
  const light = theme === 'light';
  const themeLabel = light ? 'Switch to dark theme' : 'Switch to light theme';

  const toggleTheme = () => {
    const next: Theme = light ? 'dark' : 'light';
    setTheme(next);
    setThemeState(next);
  };

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" id="menuBtn" type="button" aria-label="Course outline" aria-expanded={menuOpen} onClick={onMenu}>
        {MENU_ICON}
      </button>
      <div className="logo"><span className="logo-mark">{LOGO_ICON}</span>Sky Library</div>
      <div className="course-title">{COURSE_TITLE}</div>
      <div className="spacer" />
      <div className="progress">
        <div className="bar"><i id="barFill" style={{ width: `${(done / total) * 100}%` }} /></div>
        <span id="progText">{done} of {total} complete</span>
      </div>
      {/* The icon strings are shared with the plain-DOM sign-in page, hence innerHTML rather than JSX. */}
      <button className="icon-btn" id="themeBtn" type="button" aria-label={themeLabel} title={themeLabel} onClick={toggleTheme} dangerouslySetInnerHTML={{ __html: light ? MOON : SUN }} />
      <a className="icon-btn" href="/logout" title="Sign out" aria-label="Sign out">{LOGOUT_ICON}</a>
    </header>
  );
}
