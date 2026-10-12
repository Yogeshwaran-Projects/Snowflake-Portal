// Scripted CoCo / Cortex session for learners with no Snowflake account.
// Mounted by LessonBody through a portal into `[data-simulator="<id>"]`; the
// session comes from the lesson's JSON (LessonData.simulators).
//
// Test hooks (keep when restyling):
//   [data-sim-root="<id>"]  the panel
//   [data-sim-step="<n>"]   zero-based index of the step in view
//   [data-sim-prev] [data-sim-next] [data-sim-all]  controls
//
// Checklist ticks live in memory only: they are a review habit for THIS
// read-through, not progress worth saving.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { copyPreText } from '../lib/lessonDom';
import type { Cell, SimSession, SimStep } from '../types';
import '../styles/simulator.css';

interface Props {
  session: SimSession;
}

const TOOL_NAME: Record<SimSession['tool'], string> = { coco: 'CoCo', cortex: 'Cortex' };

export default function Simulator({ session }: Props) {
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const total = session.steps.length;
  const last = Math.max(0, total - 1);
  const tool = TOOL_NAME[session.tool];

  const go = (next: number) => setIndex(Math.min(last, Math.max(0, next)));
  const toggleTick = (key: string) => setTicks(prev => ({ ...prev, [key]: !prev[key] }));

  // Arrow keys step through while focus is on the controls — NOT anywhere in
  // the panel, or arrowing through the checklist would jump steps.
  const onControlsKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (showAll) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
  };

  const shown = showAll ? session.steps.map((s, i) => [s, i] as const) : session.steps[index] ? [[session.steps[index], index] as const] : [];

  return (
    <div className={`sim sim-${session.tool}`} data-sim-root={session.id} role="group" aria-label={`${tool} simulator: ${session.title}`}>
      <div className="sim-head">
        <span className="sim-badge">{tool}</span>
        <h3 className="sim-title">{session.title}</h3>
        <span className="sim-tag">Simulated session</span>
      </div>
      {session.intro && <p className="sim-intro">{session.intro}</p>}
      <div className="sim-body" aria-live="polite">
        {shown.map(([step, i]) => (
          <StepView key={i} step={step} n={i} total={total} tool={session.tool} ticks={ticks} onTick={toggleTick} />
        ))}
      </div>
      <div className="sim-controls" onKeyDown={onControlsKey}>
        <button className="btn btn-secondary" type="button" data-sim-prev disabled={showAll || index === 0} onClick={() => go(index - 1)}>Back</button>
        <span className="sim-count" data-sim-step={index}>{showAll ? `All ${total} steps` : `Step ${index + 1} of ${total}`}</span>
        <button className="btn btn-primary" type="button" data-sim-next disabled={showAll || index >= last} onClick={() => go(index + 1)}>Next</button>
        <button className="btn btn-secondary sim-all" type="button" data-sim-all aria-pressed={showAll} onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Step through' : 'Show all steps'}
        </button>
      </div>
    </div>
  );
}

interface StepProps {
  step: SimStep;
  n: number;
  total: number;
  tool: SimSession['tool'];
  ticks: Record<string, boolean>;
  onTick: (key: string) => void;
}

function StepView({ step, n, total, tool, ticks, onTick }: StepProps) {
  const name = TOOL_NAME[tool];
  return (
    <div className="sim-step" data-sim-step-view={n}>
      <span className="sim-step-no">Step {n + 1} of {total}</span>
      {tool === 'coco' ? (
        <div className="sim-msg you"><span className="sim-who">You → CoCo</span><p>{step.prompt}</p></div>
      ) : (
        <div className="sim-request"><span className="sim-who">You run</span><pre>{step.prompt}</pre></div>
      )}
      {step.say && <div className="sim-msg tool"><span className="sim-who">{name}</span><p>{step.say}</p></div>}
      {step.code && <SimCode lang={step.code.lang} text={step.code.text} />}
      {step.output && <SimGrid columns={step.output.columns} rows={step.output.rows} />}
      {step.outputText && <div className="sim-text"><span className="sim-who">Output</span><pre>{step.outputText}</pre></div>}
      {step.check && step.check.length > 0 && (
        <fieldset className="sim-check">
          <legend>Check before you accept this</legend>
          {step.check.map((c, j) => {
            const key = `${n}:${j}`;
            return (
              <label key={key} className={ticks[key] ? 'checked' : undefined}>
                <input type="checkbox" checked={ticks[key] ?? false} onChange={() => onTick(key)} />
                <span>{c}</span>
              </label>
            );
          })}
        </fieldset>
      )}
    </div>
  );
}

function SimCode({ lang, text }: { lang: string; text: string }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(t => clearTimeout(t)), []);
  const copy = () => {
    if (btnRef.current && preRef.current) copyPreText(btnRef.current, preRef.current, t => timers.current.push(t));
  };
  return (
    <div className="sim-code">
      <span className="sim-lang">{lang}</span>
      <div className="code">
        <button className="copy" type="button" data-sim-copy ref={btnRef} onClick={copy} aria-label={`Copy ${lang} code`}>Copy</button>
        <pre ref={preRef}>{text}</pre>
      </div>
    </div>
  );
}

// Same classes as ResultGrid's table so it looks like a worksheet result;
// not ResultGrid itself, whose "0 ms" timing bar would be a fake number here.
function SimGrid({ columns, rows }: { columns: string[]; rows: Cell[][] }) {
  const numeric = columns.map((_, i) => rows.some(r => typeof r[i] === 'number') && rows.every(r => r[i] == null || typeof r[i] === 'number'));
  return (
    <div className="results sim-out">
      <div className="results-bar"><span>Result</span><span>{rows.length} row{rows.length === 1 ? '' : 's'}</span></div>
      <div className="grid-wrap">
        <table>
          <thead><tr>{columns.map((c, i) => <th key={i} className={numeric[i] ? 'num' : undefined}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>
                {columns.map((_, ci) => {
                  const v = r[ci] ?? null;
                  return <td key={ci} className={numeric[ci] ? 'num' : undefined}>{v === null ? <span className="null">NULL</span> : String(v)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
