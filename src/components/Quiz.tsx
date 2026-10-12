// Knowledge check: one attempt per question, instant feedback with the
// reason, best score saved to Progress. "Try again" resets the questions.
// Mounted through a portal into the lesson's `[data-quiz]` panel, so the
// markup below IS the panel's content (same classes as the old quiz.js).
import { useState } from 'react';
import { Progress } from '../lib/progress';
import type { QuizQuestion } from '../types';

interface Props {
  /** progressKey() of the lesson: bare '1-1' for Fundamentals, 'sql/1-1' elsewhere. */
  scoreKey: string;
  questions: QuizQuestion[];
}

type Picks = (number | null)[];

function countCorrect(questions: QuizQuestion[], picks: Picks) {
  return questions.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0);
}

export default function Quiz({ scoreKey, questions }: Props) {
  const [picks, setPicks] = useState<Picks>(() => questions.map(() => null));
  // Read once per attempt, like the old remount-on-retry: the header shows
  // the best BEFORE this attempt, then refreshes when the learner retries.
  const [best, setBest] = useState(() => Progress.bestScore(scoreKey));
  const total = questions.length;
  const score = countCorrect(questions, picks);
  const finished = picks.every(p => p !== null);

  const pick = (i: number, j: number) => {
    if ((picks[i] ?? null) !== null) return;
    const next = picks.slice();
    next[i] = j;
    setPicks(next);
    // Saved from the handler, not an effect: saveScore only keeps a higher
    // score, so StrictMode's double render cannot corrupt it either way.
    if (next.every(p => p !== null)) Progress.saveScore(scoreKey, countCorrect(questions, next), total);
  };

  const retry = () => {
    setPicks(questions.map(() => null));
    setBest(Progress.bestScore(scoreKey));
  };

  return (
    <>
      <div className="panel-head">
        <h3>{total} questions</h3>
        <span className="score">Score <b data-score>{score} / {total}</b>{best ? ` · Best ${best.score} / ${best.total}` : ''}</span>
      </div>
      <div data-qs>
        {questions.map((item, i) => {
          const picked = picks[i] ?? null;
          const answered = picked !== null;
          const ok = picked === item.answer;
          return (
            <div className="q" key={i}>
              <p>{i + 1}. {item.q}</p>
              {item.options.map((text, j) => {
                const cls = ['opt', answered && j === item.answer && 'right', answered && j === picked && !ok && 'wrong'].filter(Boolean).join(' ');
                return (
                  <button className={cls} type="button" data-j={j} key={j} disabled={answered} onClick={() => pick(i, j)}>{text}</button>
                );
              })}
              <div className="feedback" hidden={!answered}>
                {answered && <><b>{ok ? 'Correct.' : 'Incorrect.'}</b> {item.why}</>}
              </div>
            </div>
          );
        })}
      </div>
      <button className="btn btn-secondary retry" type="button" data-retry hidden={!finished} onClick={retry}>Try again</button>
    </>
  );
}
