// Home (#home, and the landing page for '' and unknown hashes): one card per
// course in registry order, then a smaller card for the SQL Playground.
//
// Test hooks: [data-home] root, [data-course-card="<id>"] per course,
// [data-course-cta] its Start/Continue link, [data-playground-card].
import { useSyncExternalStore } from 'react';
import { COURSES, lessonsOf, totalMinutes } from '../courses';
import { continueHash, lastVisitedLesson } from '../lib/courseLinks';
import { Progress } from '../lib/progress';
import { PLAYGROUND_HASH } from '../lib/route';
import type { Course } from '../types';
import '../styles/home.css';

// Half-hour steps: "~7.5 hours" is honest, "~7.53 hours" is false precision.
function formatHours(mins: number): string {
  const hours = Math.max(0.5, Math.round(mins / 30) / 2);
  return `~${hours} hour${hours === 1 ? '' : 's'}`;
}

export default function Home() {
  useSyncExternalStore(Progress.subscribe, Progress.version);
  return (
    <div className="home" data-home>
      <header className="home-head">
        <h1>Choose your course</h1>
        <p className="lede">Four courses, from your first SELECT to building AI projects on Snowflake. Pick one and the portal remembers where you left off.</p>
      </header>
      <div className="course-grid">
        {COURSES.map(c => <CourseCard key={c.id} course={c} />)}
      </div>
      <a className="play-card" href={PLAYGROUND_HASH} data-playground-card>
        <span className="play-ico" aria-hidden="true">
          <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 17V7l6 5-6 5zM12 7h8M12 12h8M12 17h8" /></svg>
        </span>
        <span className="play-text">
          <b>SQL Playground</b>
          <span>A full bank database in your browser with 40 graded exercises. {Progress.solvedCount()} solved.</span>
        </span>
        <span className="play-go" aria-hidden="true">Open →</span>
      </a>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const lessons = lessonsOf(course);
  const pct = Progress.percent(course.id);
  const last = lastVisitedLesson(course);
  const headingId = `course-${course.id}-title`;
  return (
    <article className="course-card" data-course-card={course.id} aria-labelledby={headingId}>
      <div className="cc-top">
        <span className="badge">{course.level}</span>
        <span className="cc-meta">{lessons.length} lessons · {formatHours(totalMinutes(course))}</span>
      </div>
      <h2 id={headingId}>{course.title}</h2>
      <p className="cc-tagline">{course.tagline}</p>
      {course.project && (
        <p className="cc-project"><span className="cc-project-label">Project</span> {course.project.title}</p>
      )}
      <div className="cc-progress">
        <div className="bar" role="progressbar" aria-label={`${course.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <span>{pct}%</span>
      </div>
      <a className="btn btn-primary cc-cta" href={continueHash(course)} data-course-cta>
        {last ? `Continue → ${last.title}` : 'Start'}
      </a>
    </article>
  );
}
