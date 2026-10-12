// Sticky top bar: outline toggle (phones), logo, course switcher, live
// progress, theme toggle and sign-out. Sign-out is a plain link on purpose:
// /logout is served by the middleware and must clear the cookie with a full
// page load. Progress is the CURRENT course's on a lesson, overall elsewhere.
import { useState, useSyncExternalStore, type ChangeEvent } from 'react';
import { COURSES, findCourse, lessonsOf } from '../courses';
import { MOON, SUN } from '../lib/icons';
import { Progress } from '../lib/progress';
import { continueHash } from '../lib/courseLinks';
import { HOME_HASH, PLAYGROUND_HASH } from '../lib/route';
import { currentTheme, setTheme, type Theme } from '../lib/theme';

interface Props {
  /** Course of the lesson in view; null on Home and the playground. */
  courseId: string | null;
  /** Which page the switcher shows as selected. */
  page: 'home' | 'playground' | 'lesson';
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

const HOME_VALUE = 'home';
const PLAYGROUND_VALUE = 'playground';

function totalLessons(courseId: string | null): number {
  if (courseId === null) return COURSES.reduce((n, c) => n + lessonsOf(c).length, 0);
  const course = findCourse(courseId);
  return course ? lessonsOf(course).length : 0;
}

export default function TopBar({ courseId, page, menuOpen, onMenu }: Props) {
  useSyncExternalStore(Progress.subscribe, Progress.version);
  const done = Progress.doneCount(courseId ?? undefined);
  const total = totalLessons(courseId);
  const [theme, setThemeState] = useState<Theme>(currentTheme);
  const light = theme === 'light';
  const themeLabel = light ? 'Switch to dark theme' : 'Switch to light theme';
  const selected = page === 'lesson' && courseId !== null ? courseId : page === 'playground' ? PLAYGROUND_VALUE : HOME_VALUE;

  const toggleTheme = () => {
    const next: Theme = light ? 'dark' : 'light';
    setTheme(next);
    setThemeState(next);
  };

  // Switching course opens where the learner left off in it, not lesson 1.
  const switchTo = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === HOME_VALUE) location.hash = HOME_HASH;
    else if (value === PLAYGROUND_VALUE) location.hash = PLAYGROUND_HASH;
    else {
      const course = findCourse(value);
      if (course) location.hash = continueHash(course);
    }
  };

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" id="menuBtn" type="button" aria-label="Course outline" aria-expanded={menuOpen} onClick={onMenu}>
        {MENU_ICON}
      </button>
      <a className="logo" href={HOME_HASH} aria-label="Sky Library, all courses"><span className="logo-mark">{LOGO_ICON}</span><span className="logo-text">Sky Library</span></a>
      <label className="sr-only" htmlFor="courseSwitch">Course</label>
      <select className="course-switch" id="courseSwitch" data-course-switch value={selected} onChange={switchTo}>
        <option value={HOME_VALUE}>All courses</option>
        {COURSES.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        <option value={PLAYGROUND_VALUE}>SQL Playground</option>
      </select>
      <div className="spacer" />
      <div className="progress" title={courseId === null ? 'All courses' : undefined}>
        <div className="bar"><i id="barFill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
        <span id="progText">{done} of {total} complete</span>
      </div>
      {/* The icon strings are shared with the plain-DOM sign-in page, hence innerHTML rather than JSX. */}
      <button className="icon-btn" id="themeBtn" type="button" aria-label={themeLabel} title={themeLabel} onClick={toggleTheme} dangerouslySetInnerHTML={{ __html: light ? MOON : SUN }} />
      <a className="icon-btn" href="/logout" title="Sign out" aria-label="Sign out">{LOGOUT_ICON}</a>
    </header>
  );
}
