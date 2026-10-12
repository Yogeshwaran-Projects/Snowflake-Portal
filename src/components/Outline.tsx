// Left menu. On a lesson it shows THAT course: a link back to all courses,
// the Playground, the course project's milestones (if any), then every module
// with its lessons, done ticks and minutes. On Home and the playground it
// lists the courses instead. On phones (≤860px, app.css) it is a drawer: the
// parent owns `open`; this component only reports when it wants to close.
import { useSyncExternalStore } from 'react';
import { COURSES, findCourse, lessonHash, lessonsOf } from '../courses';
import { continueHash } from '../lib/courseLinks';
import { Progress } from '../lib/progress';
import { HOME_HASH, PLAYGROUND_HASH } from '../lib/route';
import type { Course } from '../types';

interface Props {
  /** Course of the lesson in view; null on Home and the playground. */
  courseId: string | null;
  /** Lesson in view, or null off a lesson. */
  currentId: string | null;
  onPlayground: boolean;
  open: boolean;
  onClose: () => void;
}

const CHECK = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" aria-hidden="true"><path d="m5 12 5 5L20 7" /></svg>
);
const PLAY = (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 17V7l6 5-6 5zM12 7h8M12 12h8M12 17h8" /></svg>
);
const GRID = (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>
);

export default function Outline({ courseId, currentId, onPlayground, open, onClose }: Props) {
  // One primitive snapshot for every counter so any save re-renders the
  // whole outline; the ticks themselves are read straight from Progress.
  useSyncExternalStore(Progress.subscribe, Progress.version);
  const course = courseId === null ? undefined : findCourse(courseId);

  return (
    <aside className={`outline${open ? ' open' : ''}`} id="outline" aria-label="Course outline">
      <div className="mod">
        <a className={`lesson-link play-link${course ? '' : onPlayground ? '' : ' current'}`} href={HOME_HASH} data-home-link onClick={onClose}>
          <span className="st">{GRID}</span>All courses
        </a>
        <a className={`lesson-link play-link${onPlayground ? ' current' : ''}`} href={PLAYGROUND_HASH} onClick={onClose}>
          <span className="st">{PLAY}</span>SQL Playground<span className="dur">{Progress.solvedCount()} solved</span>
        </a>
      </div>
      {course ? <CourseOutline course={course} currentId={currentId} onClose={onClose} /> : <CourseList onClose={onClose} />}
    </aside>
  );
}

function CourseList({ onClose }: { onClose: () => void }) {
  return (
    <div className="mod">
      <div className="mod-head"><b>Courses</b></div>
      {COURSES.map(c => (
        <a className="lesson-link" href={continueHash(c)} key={c.id} data-outline-course={c.id} onClick={onClose}>
          <span className="st" />
          {c.title}
          <span className="dur">{Progress.percent(c.id)}%</span>
        </a>
      ))}
    </div>
  );
}

interface CourseProps {
  course: Course;
  currentId: string | null;
  onClose: () => void;
}

function CourseOutline({ course, currentId, onClose }: CourseProps) {
  const isDone = (lessonId: string) => Progress.isDone(course.id, lessonId);
  const project = course.project;
  return (
    <>
      <div className="mod course-name"><div className="mod-head"><b>{course.title}</b><span>{Progress.doneCount(course.id)}/{lessonsOf(course).length}</span></div></div>
      {project && (
        <div className="mod project-block" data-project>
          <div className="mod-head"><b>Project: {project.title}</b><span>{project.milestones.filter(m => isDone(m.lessonId)).length}/{project.milestones.length}</span></div>
          {project.milestones.map(m => {
            const done = isDone(m.lessonId);
            const cls = ['lesson-link', 'milestone', m.lessonId === currentId && 'current', done && 'done'].filter(Boolean).join(' ');
            return (
              <a className={cls} href={lessonHash(course.id, m.lessonId)} key={m.id} data-milestone={m.id} data-done={done ? '' : undefined} onClick={onClose}
                aria-label={`${m.id} ${m.title}${done ? ', done' : ''}`}>
                <span className="st">{done ? CHECK : null}</span>
                <span><b className="ms-id">{m.id}</b> {m.title}</span>
                <span className="dur">{m.lessonId.replace('-', '.')}</span>
              </a>
            );
          })}
        </div>
      )}
      {course.modules.map(m => (
        <div className="mod" key={m.title}>
          <div className="mod-head"><b>{m.title}</b><span>{m.lessons.filter(l => isDone(l.id)).length}/{m.lessons.length}</span></div>
          {m.lessons.map(l => {
            const done = isDone(l.id);
            const cls = ['lesson-link', l.id === currentId && 'current', done && 'done'].filter(Boolean).join(' ');
            return (
              <a className={cls} href={lessonHash(course.id, l.id)} key={l.id} aria-current={l.id === currentId ? 'page' : undefined} onClick={onClose}>
                <span className="st">{done ? CHECK : null}</span>
                {l.id.replace('-', '.')} {l.title}
                <span className="dur">{l.mins}m</span>
              </a>
            );
          })}
        </div>
      ))}
    </>
  );
}
