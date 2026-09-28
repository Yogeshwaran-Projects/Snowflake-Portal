// Exercise list with level/topic filters and solved ticks; opening one swaps
// the list for ExerciseDetail. Checking runs the LEARNER's editor SQL and the
// reference answer on the SAME database, so a learner who has modified the
// data is still graded fairly against what the reference returns now.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Progress } from '../lib/progress';
import { sameResult, type SqlDb } from '../sql/engine';
import type { QueryResult } from '../types';
import ExerciseDetail, { type Verdict } from './ExerciseDetail';
import { EXERCISES, LEVELS, TOPICS, type Exercise } from './exercises';
import { errorMessage } from './useBankDb';

interface Props {
  db: SqlDb | null;
  getSql: () => string;
  /** Runs SQL through the page so the result shows in the grid; null when it failed. */
  runLearner: (sql: string) => Promise<QueryResult | null>;
  onLoadSql: (sql: string) => void;
}

export default function ExercisePanel({ db, getSql, runLearner, onLoadSql }: Props) {
  const [level, setLevel] = useState('All');
  const [topic, setTopic] = useState('All');
  const [openId, setOpenId] = useState<string | null>(null);
  // Re-render on progress changes; isSolved reads the store directly below.
  const solvedCount = useSyncExternalStore(Progress.subscribe, Progress.solvedCount);
  const solvedHere = EXERCISES.filter(e => Progress.isSolved(e.id)).length;
  void solvedCount;

  // Opening an exercise from far down the list swaps a tall list for a short
  // detail; without this the page stays scrolled and the detail's top (and
  // its Check button) sits hidden under the sticky top bar.
  const panelRef = useRef<HTMLElement>(null);
  const skipFirst = useRef(true);
  useEffect(() => {
    if (skipFirst.current) { skipFirst.current = false; return; }
    const el = panelRef.current;
    if (el && el.getBoundingClientRect().top < 64) el.scrollIntoView({ block: 'start' });
  }, [openId]);

  const filtered = EXERCISES.filter(e => (level === 'All' || e.level === level) && (topic === 'All' || e.topic === topic));
  const open = openId ? EXERCISES.find(e => e.id === openId) ?? null : null;

  const check = async (ex: Exercise): Promise<Verdict> => {
    if (!db) return { ok: false, text: 'The SQL engine is still starting — try again in a moment.' };
    const sql = getSql();
    if (!sql.trim()) return { ok: false, text: 'The editor is empty. Write your query first, then check.' };
    const learner = await runLearner(sql);
    if (!learner) return { ok: false, text: 'Your query did not run — the error is shown under the results.' };
    let expected: QueryResult;
    try { expected = await db.run(ex.answer); }
    catch (e) { return { ok: false, text: `The reference answer could not run on the current data: ${errorMessage(e)}. Reset data and try again.` }; }
    if (sameResult(learner, expected)) {
      Progress.markSolved(ex.id);
      return { ok: true, text: `Correct — ${expected.rows.length} row${expected.rows.length === 1 ? '' : 's'} match the expected result.` };
    }
    const shape = (r: QueryResult) => `${r.rows.length} row${r.rows.length === 1 ? '' : 's'} × ${r.columns.length} column${r.columns.length === 1 ? '' : 's'}`;
    return {
      ok: false,
      text: learner.rows.length === expected.rows.length && learner.columns.length === expected.columns.length
        ? `Not yet — same shape (${shape(learner)}) but the values differ. Check filters, rounding and whether you returned exactly the columns asked for.`
        : `Not yet — you returned ${shape(learner)}, expected ${shape(expected)}.`,
    };
  };

  return (
    <section ref={panelRef} className="panel pg-exercises" aria-label="Exercises">
      <div className="panel-head">
        <h3>Exercises</h3>
        <span className="score"><b>{solvedHere}</b> / {EXERCISES.length} solved</span>
      </div>
      {open ? (
        <ExerciseDetail key={open.id} ex={open} solved={Progress.isSolved(open.id)} onBack={() => setOpenId(null)} onCheck={() => check(open)} onLoadSql={onLoadSql} />
      ) : (
        <>
          <div className="pg-filters">
            <label>Level
              <select value={level} onChange={e => setLevel(e.target.value)}>
                <option>All</option>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label>Topic
              <select value={topic} onChange={e => setTopic(e.target.value)}>
                <option>All</option>
                {TOPICS.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
          </div>
          <ul className="pg-ex-list">
            {filtered.map(e => {
              const solved = Progress.isSolved(e.id);
              return (
                <li key={e.id}>
                  <button type="button" className={`pg-ex-item${solved ? ' solved' : ''}`} data-ex-id={e.id} onClick={() => setOpenId(e.id)}>
                    <span className="pg-tick" aria-label={solved ? 'Solved' : 'Not solved'}>{solved ? '✓' : ''}</span>
                    <span className="pg-ex-title"><b>{e.title}</b><small>{e.level} · {e.topic}</small></span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="empty">No exercises match those filters.</li>}
          </ul>
        </>
      )}
    </section>
  );
}
