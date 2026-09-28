// One open exercise: task, hint on demand, "Check my answer" (runs the
// editor's SQL and compares VALUES with the reference), and the solution
// revealed on request. The reference SQL is never shown until asked, so a
// learner cannot glance at it by accident.
import { useState } from 'react';
import type { Exercise } from './exercise-types';

export interface Verdict { ok: boolean; text: string }

interface Props {
  ex: Exercise;
  solved: boolean;
  onBack: () => void;
  onCheck: () => Promise<Verdict>;
  onLoadSql: (sql: string) => void;
}

export default function ExerciseDetail({ ex, solved, onBack, onCheck, onLoadSql }: Props) {
  const [hint, setHint] = useState(false);
  const [solution, setSolution] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try { setVerdict(await onCheck()); } finally { setChecking(false); }
  };

  return (
    <div className="pg-ex-detail" data-ex-id={ex.id}>
      <button type="button" className="pg-back" onClick={onBack}>← All exercises</button>
      <div className="meta">
        <span className="badge">{ex.level}</span>
        <span>{ex.topic}</span>
        <span className="pg-ex-id">{ex.id}</span>
        {solved && <span className="pg-solved">✓ Solved</span>}
      </div>
      <h4>{ex.title}</h4>
      <p className="pg-task">{ex.task}</p>
      {hint
        ? <p className="pg-hint"><b>Hint.</b> {ex.hint}</p>
        : <button type="button" className="pg-link" onClick={() => setHint(true)}>Show hint</button>}
      <div className="pg-ex-actions">
        <button type="button" className="btn btn-primary" data-check-ex onClick={check} disabled={checking}>
          {checking ? 'Checking…' : 'Check my answer'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setSolution(v => !v)}>
          {solution ? 'Hide solution' : 'Show solution'}
        </button>
      </div>
      {verdict && (
        <p className={`verdict ${verdict.ok ? 'ok' : 'bad'}`} role="status">{verdict.text}</p>
      )}
      {solution && (
        <div className="pg-solution">
          <span className="overline">Reference answer</span>
          <pre className="pg-sql">{ex.answer}</pre>
          <p className="pg-note-text">{ex.solutionNote}</p>
          <button type="button" className="btn btn-secondary" onClick={() => onLoadSql(ex.answer)}>Load into editor</button>
        </div>
      )}
    </div>
  );
}
