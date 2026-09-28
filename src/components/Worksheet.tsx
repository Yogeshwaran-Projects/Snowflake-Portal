// In-browser SQL worksheet. Each lesson gets its OWN database, built from
// the lesson's JSON, so one lesson's edits never leak into another; the
// database is closed when the lesson unmounts.
//
// Mounted through a portal into the lesson's `[data-worksheet]` div. The
// class names and data hooks below (.ws, [data-run], [data-status],
// [data-check="i"], .verdict ok/bad) are what the automated tests drive —
// keep them when restyling.
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { createDb, sameResult, type SqlDb } from '../sql/engine';
import type { QueryResult, SchemaTable, WorksheetConfig } from '../types';
import ResultGrid from './ResultGrid';
import SqlEditor from './SqlEditor';

interface Props {
  config: WorksheetConfig;
}

type Tab = 'editor' | 'schema';
type Boot = { kind: 'starting' } | { kind: 'ready' } | { kind: 'failed'; message: string };
interface Status { text: string; tone: 'ok' | 'bad' | null }
interface Verdict { ok: boolean; text: string }

const PLACEHOLDER = 'Select Run to see results. Tip: Ctrl + Enter also runs the query.';
const ERROR_HINT = ". Check the spelling of table and column names, and that text values are in 'single quotes'.";
const VERDICT_ERROR = 'Your SQL has an error. Run it first and fix the message shown in the results.';
const VERDICT_OK = 'Correct. Your query returns exactly the right answer.';
const VERDICT_BAD = 'Not yet. Your query runs, but the answer is different. Re-read the task and the hint.';
const VERDICT_NO_REFERENCE = 'The reference answer could not run. Refresh the page and try again.';

const RUN_ICON = <svg className="ico" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l11-7z" /></svg>;

function messageOf(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

export default function Worksheet({ config }: Props) {
  const dbRef = useRef<SqlDb | null>(null);
  const sqlRef = useRef(config.starter);
  const runSeq = useRef(0);
  const [boot, setBoot] = useState<Boot>({ kind: 'starting' });
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [tab, setTab] = useState<Tab>('editor');
  const [sql, setSqlState] = useState(config.starter);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<Status>({ text: 'Results', tone: null });
  const [ms, setMs] = useState<number | null>(null);
  const [verdicts, setVerdicts] = useState<Record<number, Verdict>>({});

  useEffect(() => {
    // StrictMode mounts, unmounts and mounts again: the first boot must close
    // its database when it lands after the cleanup, or two engines stay alive.
    let alive = true;
    let db: SqlDb | null = null;
    createDb(config.tables).then(async created => {
      if (!alive) { await created.close(); return; }
      db = created;
      dbRef.current = created;
      const tables = await created.schema();
      if (!alive) return;
      setSchema(tables);
      setBoot({ kind: 'ready' });
    }).catch((e: unknown) => {
      if (alive) setBoot({ kind: 'failed', message: messageOf(e) });
    });
    return () => {
      alive = false;
      dbRef.current = null;
      if (db) void db.close();
    };
  }, [config]);

  const setSql = useCallback((text: string) => {
    sqlRef.current = text;
    setSqlState(text);
  }, []);

  const runSql = useCallback(async (text: string) => {
    const db = dbRef.current;
    if (!db) return;
    // Only the newest run may paint: a slow query finishing after a faster
    // one would otherwise overwrite the result the learner is looking at.
    const seq = ++runSeq.current;
    setTab('editor');
    setRunning(true);
    try {
      const r = await db.run(text);
      if (seq !== runSeq.current) return;
      setResult(r);
      setError(null);
      setMs(Math.max(1, Math.round(r.ms)));
      const n = r.rows.length;
      setStatus({ text: n ? `${n} row${n > 1 ? 's' : ''}` : 'Query ran', tone: 'ok' });
    } catch (e) {
      if (seq !== runSeq.current) return;
      setResult(null);
      setError(messageOf(e) + ERROR_HINT);
      setMs(null);
      setStatus({ text: 'Query failed', tone: 'bad' });
    } finally {
      if (seq === runSeq.current) setRunning(false);
    }
  }, []);

  // Stable so an editor that binds Ctrl/Cmd+Enter once at mount still runs the CURRENT text.
  const onRun = useCallback(() => { void runSql(sqlRef.current); }, [runSql]);

  const loadExample = (text: string) => {
    setSql(text);
    void runSql(text);
  };

  const check = async (i: number) => {
    const challenge = config.challenges?.[i];
    const db = dbRef.current;
    if (!challenge || !db) return;
    const setVerdict = (v: Verdict) => setVerdicts(prev => ({ ...prev, [i]: v }));
    let mine: QueryResult;
    try { mine = await db.run(sqlRef.current); } catch { setVerdict({ ok: false, text: VERDICT_ERROR }); return; }
    let official: QueryResult;
    try { official = await db.run(challenge.answer); } catch { setVerdict({ ok: false, text: VERDICT_NO_REFERENCE }); return; }
    const ok = sameResult(mine, official);
    setVerdict({ ok, text: ok ? VERDICT_OK : VERDICT_BAD });
    await runSql(sqlRef.current);
  };

  const ready = boot.kind === 'ready';
  const statusText = boot.kind === 'starting' ? 'Starting the SQL engine…' : boot.kind === 'failed' ? 'SQL engine failed' : null;

  return (
    <>
      <div className="ws" data-ready={ready ? '' : undefined}>
        <div className="ws-bar">
          <button className={`ws-tab${tab === 'editor' ? ' on' : ''}`} data-tab="editor" type="button" onClick={() => setTab('editor')}>Worksheet</button>
          <button className={`ws-tab${tab === 'schema' ? ' on' : ''}`} data-tab="schema" type="button" onClick={() => setTab('schema')}>Schema</button>
          <button className="btn" data-run type="button" disabled={!ready} onClick={onRun}>{RUN_ICON}Run</button>
        </div>
        <div hidden={tab === 'schema'}>
          <SqlEditor value={sql} onChange={setSql} onRun={onRun} schema={schema} ariaLabel="SQL editor" />
        </div>
        {tab === 'schema' && <SchemaPane schema={schema} config={config} pending={!ready} />}
      </div>
      <div className="examples">
        Examples: {config.examples.map((e, i) => (
          <button type="button" data-ex={i} key={i} disabled={!ready} onClick={() => loadExample(e.sql)}>{e.label}</button>
        ))}
      </div>
      <div className="ws-out">
        <div className="results-bar">
          <span data-status>
            {statusText ?? (status.tone ? <span className={`dot ${status.tone}`}>{status.text}</span> : status.text)}
          </span>
          <span data-time>{ms !== null ? `${ms} ms` : ''}</span>
        </div>
        {boot.kind === 'failed'
          ? <div className="empty bad">The SQL engine could not start: {boot.message}. Refresh the page to try again.</div>
          : <ResultGrid result={result} error={error} running={running} placeholder={PLACEHOLDER} />}
      </div>
      {config.challenges && config.challenges.length > 0 && (
        <div className="panel">
          <div className="panel-head"><h3>Challenges</h3><span className="overline">Write the SQL above, then check</span></div>
          {config.challenges.map((c, i) => {
            const v = verdicts[i];
            return (
              <div className="challenge" key={i}>
                <div><p><b>{i + 1}.</b> {c.task}</p><p className="hint">Hint: {c.hint}</p></div>
                <button className="btn btn-secondary" type="button" data-check={i} disabled={!ready} onClick={() => { void check(i); }}>Check my answer</button>
                <div className={v ? `verdict ${v.ok ? 'ok' : 'bad'}` : 'verdict'} hidden={!v}>{v?.text}</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// Live schema from the engine (names, types, row counts) with the authoring
// notes from the lesson JSON, which the engine cannot know about.
function SchemaPane({ schema, config, pending }: { schema: SchemaTable[]; config: WorksheetConfig; pending: boolean }) {
  if (pending) return <div className="schema"><span className="ty">Starting the SQL engine…</span></div>;
  const noteFor = (table: string, column: string) => {
    const def = config.tables[table] ?? Object.entries(config.tables).find(([n]) => n.toLowerCase() === table.toLowerCase())?.[1];
    return def?.columns.find(([n]) => n.toLowerCase() === column.toLowerCase())?.[2];
  };
  return (
    <div className="schema">
      {schema.map((t, ti) => {
        const width = Math.max(0, ...t.columns.map(c => c.name.length));
        return (
          <Fragment key={t.name}>
            {ti > 0 ? '\n\n' : ''}
            <span className="t">{t.name}</span> <span className="ty">· {t.rowCount} rows</span>
            {t.columns.map(c => {
              const note = noteFor(t.name, c.name);
              return <Fragment key={c.name}>{'\n  '}{c.name.padEnd(width)}{'  '}<span className="ty">{c.type}{note ? `   -- ${note}` : ''}</span></Fragment>;
            })}
          </Fragment>
        );
      })}
    </div>
  );
}
