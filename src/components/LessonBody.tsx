// The injected lesson fragment plus its portals. Keyed by '<course>/<id>'
// from LessonView, so a lesson change is a full remount: the old fragment,
// its listeners and its portals go away together.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  collectSections, insertJump, labelTableCells, wireCompleteButton, wireCopyButtons, wireLabSteps, type Section,
} from '../lib/lessonDom';
import { Progress, progressKey } from '../lib/progress';
import type { LessonData } from '../types';
import Quiz from './Quiz';
import Simulator from './Simulator';
import Worksheet from './Worksheet';

interface Props {
  courseId: string;
  id: string;
  html: string;
  data: LessonData;
  onSections: (sections: Section[]) => void;
}

interface Mounts {
  worksheet: HTMLElement | null;
  quiz: HTMLElement | null;
  simulators: HTMLElement[];
}

export default function LessonBody({ courseId, id, html, data, onSections }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [mounts, setMounts] = useState<Mounts | null>(null);
  // Same object across renders: React resets innerHTML whenever the
  // dangerouslySetInnerHTML prop changes identity, which would wipe the
  // wired DOM and detach the portal targets on every state update.
  const inner = useMemo(() => ({ __html: html }), [html]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    setMounts({
      worksheet: root.querySelector('[data-worksheet]'),
      quiz: root.querySelector('[data-quiz]'),
      simulators: [...root.querySelectorAll<HTMLElement>('[data-simulator]')],
    });
    labelTableCells(root);
    const sections = collectSections(root);
    onSections(sections);
    const undo = [
      wireCopyButtons(root),
      wireLabSteps(root),
      insertJump(root, sections),
      wireCompleteButton(root, () => Progress.isDone(courseId, id), () => Progress.markDone(courseId, id)),
    ];
    window.scrollTo(0, 0);
    return () => undo.forEach(fn => fn());
  }, [courseId, id, html, onSections]);

  // Logged once per lesson load, not per render: a typo in a data-simulator
  // id is an authoring bug the content writer must see, but a log line per
  // re-render would bury every other message in the console.
  useEffect(() => {
    if (!mounts) return;
    const known = new Set((data.simulators ?? []).map(s => s.id));
    for (const el of mounts.simulators) {
      const simId = el.dataset.simulator ?? '';
      if (!known.has(simId)) console.error(`[SIM] mount SKIPPED (id=${simId}) — no matching entry in lesson-data.simulators`);
    }
  }, [mounts, data.simulators]);

  return (
    <>
      <article className="content" id="lesson" ref={ref} dangerouslySetInnerHTML={inner} />
      {mounts?.worksheet && data.worksheet && createPortal(<Worksheet config={data.worksheet} />, mounts.worksheet)}
      {mounts?.quiz && data.quiz && createPortal(<Quiz scoreKey={progressKey(courseId, id)} questions={data.quiz} />, mounts.quiz)}
      {mounts?.simulators.map(el => {
        const session = data.simulators?.find(s => s.id === el.dataset.simulator);
        return session ? createPortal(<Simulator session={session} />, el, session.id) : null;
      })}
    </>
  );
}
