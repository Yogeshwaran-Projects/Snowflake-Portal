// Loads course.lessonPath(id), injects it verbatim and wires the pieces that
// are not React: worksheet, quiz and simulators are mounted INTO the
// fragment through portals (one React tree, so context and StrictMode
// behave), everything else (copy buttons, lab steps, jump select,
// mark-complete) is plain DOM with undo functions from lib/lessonDom.
import { useEffect, useState } from 'react';
import { findCourse, findLesson } from '../courses';
import { fetchLesson, type Load } from '../lib/lessonLoad';
import type { Section } from '../lib/lessonDom';
import { Progress } from '../lib/progress';
import LessonBody from './LessonBody';

interface Props {
  courseId: string;
  id: string;
  /** Receives the section list for the "On this page" rail; [] while loading. */
  onSections: (sections: Section[]) => void;
}

const LOAD_FAILED = 'This lesson could not load. Check your connection and refresh the page.';

export default function LessonView({ courseId, id, onSections }: Props) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const course = findCourse(courseId);
  const key = `${courseId}/${id}`;

  useEffect(() => {
    const c = findCourse(courseId);
    if (!c) return;
    document.title = `${findLesson(c, id)?.title ?? 'Lesson'} · ${c.title} · Sky Library`;
    Progress.setLastVisited(courseId, id);
    onSections([]);
    setLoad({ status: 'loading' });
    const ctrl = new AbortController();
    void fetchLesson(key, c.lessonPath(id), ctrl.signal).then(next => { if (!ctrl.signal.aborted) setLoad(next); });
    return () => ctrl.abort();
  }, [courseId, id, key, onSections]);

  if (course && load.status === 'ready' && load.key === key) {
    return <LessonBody key={key} courseId={courseId} id={id} html={load.html} data={load.data} onSections={onSections} />;
  }
  if (course && load.status === 'missing') {
    const lesson = findLesson(course, id);
    return (
      <article className="content" id="lesson">
        <div className="panel writing" data-lesson-missing>
          <div className="panel-head"><h3>This lesson is being written</h3><span className="overline">{course.title}</span></div>
          <div className="panel-body">
            <p><b>{id.replace('-', '.')} {lesson?.title}</b> is on its way. Check back soon, or pick another lesson from the menu.</p>
          </div>
        </div>
      </article>
    );
  }
  return (
    <article className="content" id="lesson">
      <p className="loading">{load.status === 'error' ? LOAD_FAILED : 'Loading lesson…'}</p>
    </article>
  );
}
