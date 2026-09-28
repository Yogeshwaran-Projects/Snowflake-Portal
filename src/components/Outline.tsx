// Course outline: the Playground link, then every module with its lessons,
// done ticks and minutes. On phones (≤860px, app.css) it is a drawer: the
// parent owns `open`; this component only reports when it wants to close.
import { useSyncExternalStore } from 'react';
import { MODULES } from '../course';
import { Progress } from '../lib/progress';
import { PLAYGROUND_HASH } from '../lib/route';

interface Props {
  /** Lesson in view, or null on the playground. */
  currentId: string | null;
  open: boolean;
  onClose: () => void;
}

const CHECK = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m5 12 5 5L20 7" /></svg>
);
const PLAY = (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 17V7l6 5-6 5zM12 7h8M12 12h8M12 17h8" /></svg>
);

function readProgress() {
  // One primitive snapshot for both counters so a change to either re-renders
  // the whole outline; the ticks themselves are read straight from Progress.
  return `${Progress.doneCount()}:${Progress.solvedCount()}`;
}

export default function Outline({ currentId, open, onClose }: Props) {
  useSyncExternalStore(Progress.subscribe, readProgress);
  const solved = Progress.solvedCount();
  const onPlayground = currentId === null;

  return (
    <aside className={`outline${open ? ' open' : ''}`} id="outline" aria-label="Course outline">
      <div className="mod">
        <a className={`lesson-link play-link${onPlayground ? ' current' : ''}`} href={PLAYGROUND_HASH} onClick={onClose}>
          <span className="st">{PLAY}</span>SQL Playground<span className="dur">{solved} solved</span>
        </a>
      </div>
      {MODULES.map(m => {
        const done = m.lessons.filter(l => Progress.isDone(l.id)).length;
        return (
          <div className="mod" key={m.title}>
            <div className="mod-head"><b>{m.title}</b><span>{done}/{m.lessons.length}</span></div>
            {m.lessons.map(l => {
              const isDone = Progress.isDone(l.id);
              const cls = ['lesson-link', l.id === currentId && 'current', isDone && 'done'].filter(Boolean).join(' ');
              return (
                <a className={cls} href={`#${l.id}`} key={l.id} onClick={onClose}>
                  <span className="st">{isDone ? CHECK : null}</span>
                  {l.id.replace('-', '.')} {l.title}
                  <span className="dur">{l.mins}m</span>
                </a>
              );
            })}
          </div>
        );
      })}
    </aside>
  );
}
