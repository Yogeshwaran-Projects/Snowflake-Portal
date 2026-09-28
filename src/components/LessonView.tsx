// Loads /lessons/<id>.html, injects it verbatim and wires the pieces that
// are not React: worksheet and quiz are mounted INTO the fragment through
// portals (one React tree, so context and StrictMode behave), everything
// else (copy buttons, lab steps, jump select, mark-complete) is plain DOM
// with undo functions from lib/lessonDom.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ALL_LESSONS } from '../course';
import {
  collectSections, insertJump, labelTableCells, wireCompleteButton, wireCopyButtons, wireLabSteps, type Section,
} from '../lib/lessonDom';
import { Progress } from '../lib/progress';
import type { LessonData } from '../types';
import Quiz from './Quiz';
import Worksheet from './Worksheet';

interface Props {
  id: string;
  /** Receives the section list for the "On this page" rail; [] while loading. */
  onSections: (sections: Section[]) => void;
}

type Load =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; id: string; html: string; data: LessonData };

const LOAD_FAILED = 'This lesson could not load. Check your connection and refresh the page.';

// Known limitation: a lesson whose JSON is malformed renders without its
// worksheet and quiz instead of failing the whole page — the prose is still
// worth showing and the authoring error is visible in the console.
function parseLessonData(html: string): LessonData {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const raw = doc.getElementById('lesson-data')?.textContent;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as LessonData;
  } catch (e) {
    console.error('[LESSON] parse FAILED (lesson-data) — worksheet and quiz skipped', e);
    return {};
  }
}

async function fetchLesson(id: string, signal: AbortSignal): Promise<Load> {
  try {
    const res = await fetch(`/lessons/${id}.html`, { cache: 'no-store', signal });
    // A session that expired while the page was open is redirected to the
    // login page by the middleware — send the learner there, not a blank lesson.
    if (res.redirected && new URL(res.url).pathname.startsWith('/login')) {
      location.href = '/login';
      return { status: 'loading' };
    }
    if (!res.ok) return { status: 'error' };
    const html = await res.text();
    return { status: 'ready', id, html, data: parseLessonData(html) };
  } catch {
    // An aborted fetch is the previous lesson being superseded, not a failure.
    return signal.aborted ? { status: 'loading' } : { status: 'error' };
  }
}

export default function LessonView({ id, onSections }: Props) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });

  useEffect(() => {
    document.title = `${ALL_LESSONS.find(l => l.id === id)?.title ?? 'Lesson'} · Sky Library`;
    onSections([]);
    setLoad({ status: 'loading' });
    const ctrl = new AbortController();
    void fetchLesson(id, ctrl.signal).then(next => { if (!ctrl.signal.aborted) setLoad(next); });
    return () => ctrl.abort();
  }, [id, onSections]);

  if (load.status === 'ready' && load.id === id) {
    return <LessonBody key={id} id={id} html={load.html} data={load.data} onSections={onSections} />;
  }
  return (
    <article className="content" id="lesson">
      <p className="loading">{load.status === 'error' ? LOAD_FAILED : 'Loading lesson…'}</p>
    </article>
  );
}

interface BodyProps {
  id: string;
  html: string;
  data: LessonData;
  onSections: (sections: Section[]) => void;
}

interface Mounts {
  worksheet: HTMLElement | null;
  quiz: HTMLElement | null;
}

// Keyed by lesson id from the parent, so a lesson change is a full remount:
// the old fragment, its listeners and its portals go away together.
function LessonBody({ id, html, data, onSections }: BodyProps) {
  const ref = useRef<HTMLElement>(null);
  const [mounts, setMounts] = useState<Mounts | null>(null);
  // Same object across renders: React resets innerHTML whenever the
  // dangerouslySetInnerHTML prop changes identity, which would wipe the
  // wired DOM and detach the portal targets on every state update.
  const inner = useMemo(() => ({ __html: html }), [html]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    setMounts({ worksheet: root.querySelector('[data-worksheet]'), quiz: root.querySelector('[data-quiz]') });
    labelTableCells(root);
    const sections = collectSections(root);
    onSections(sections);
    const undo = [
      wireCopyButtons(root),
      wireLabSteps(root),
      insertJump(root, sections),
      wireCompleteButton(root, () => Progress.isDone(id), () => Progress.markDone(id)),
    ];
    window.scrollTo(0, 0);
    return () => undo.forEach(fn => fn());
  }, [id, html, onSections]);

  return (
    <>
      <article className="content" id="lesson" ref={ref} dangerouslySetInnerHTML={inner} />
      {mounts?.worksheet && data.worksheet && createPortal(<Worksheet config={data.worksheet} />, mounts.worksheet)}
      {mounts?.quiz && data.quiz && createPortal(<Quiz lessonId={id} questions={data.quiz} />, mounts.quiz)}
    </>
  );
}
