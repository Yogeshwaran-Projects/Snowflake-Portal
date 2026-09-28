// SQL Playground (#playground): a full fictional bank database in DuckDB-wasm
// with a table browser, editor, result grid, saved queries and 40 graded
// exercises. Owns the editor text and the last result; the panels get
// callbacks. On phones (≤860px) a segmented control shows one column at a
// time — the CSS hides the others, so state here stays the same everywhere.
import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import ResultGrid from '../components/ResultGrid';
import { Progress } from '../lib/progress';
import { BANK, BANK_ROW_COUNT } from '../playground/bank';
import EditorPanel from '../playground/EditorPanel';
import ExercisePanel from '../playground/ExercisePanel';
import { EXERCISES } from '../playground/exercises';
import { SavedQueries } from '../playground/savedQueries';
import SavedQueriesPanel from '../playground/SavedQueriesPanel';
import TableBrowser from '../playground/TableBrowser';
import { errorMessage, useBankDb } from '../playground/useBankDb';
import type { QueryResult } from '../types';
import '../styles/playground.css';

type Tab = 'editor' | 'tables' | 'exercises';
const TABS: [Tab, string][] = [['editor', 'Editor'], ['tables', 'Tables'], ['exercises', 'Exercises']];

const STARTER = `-- Sahyadri Bank playground. Edit freely, then Run (Ctrl/Cmd+Enter).
SELECT c.cust_name, c.segment, a.acct_type, a.balance
FROM customers c
JOIN accounts a ON a.cust_id = c.cust_id
ORDER BY a.balance DESC, a.acct_id
LIMIT 10;`;

export default function Playground() {
  const { db, schema, boot, bootError, refreshSchema } = useBankDb();
  const [sql, setSql] = useState(STARTER);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<Tab>('editor');
  // Ctrl+Enter fires from inside the editor with whatever closure it captured;
  // reading through a ref guarantees the CURRENT text runs.
  const sqlRef = useRef(sql);
  sqlRef.current = sql;

  const solvedTick = useSyncExternalStore(Progress.subscribe, Progress.solvedCount);
  void solvedTick;
  const solved = EXERCISES.filter(e => Progress.isSolved(e.id)).length;
  const tableCount = schema.length || Object.keys(BANK).length;
  const rowCount = schema.length ? schema.reduce((n, t) => n + t.rowCount, 0) : BANK_ROW_COUNT;

  const runSql = useCallback(async (text: string): Promise<QueryResult | null> => {
    if (!db) return null;
    setRunning(true); setError(null);
    try {
      const r = await db.run(text);
      setResult(r);
      return r;
    } catch (e) {
      setError(errorMessage(e)); setResult(null);
      return null;
    } finally {
      setRunning(false);
      void refreshSchema();
    }
  }, [db, refreshSchema]);

  const run = useCallback(() => { void runSql(sqlRef.current); }, [runSql]);
  const preview = (table: string) => {
    const q = `SELECT * FROM ${table} LIMIT 20;`;
    setSql(q); setTab('editor');
    void runSql(q);
  };
  // SqlEditor exposes no cursor, so "Insert name" appends — good enough for
  // building FROM/JOIN clauses, which is what the button is for.
  const insertName = (table: string) => setSql(s => (s === '' || /\s$/.test(s) ? s : `${s} `) + table);
  const loadSql = (text: string) => { setSql(text); setTab('editor'); };
  const reset = async () => {
    if (!db) return;
    try { await db.reset(); setResult(null); setError(null); }
    catch (e) { setError(`Reset failed: ${errorMessage(e)}`); }
    await refreshSchema();
  };

  return (
    <div className="pg" data-playground>
      <header className="lesson-head pg-head">
        <h1>SQL Playground</h1>
        <p className="lede">
          Practise on a full bank database. Runs DuckDB in your browser, standard SQL very close to Snowflake.
          Snowflake-only commands (Time Travel, CLONE, Cortex, CoCo) are practised in the lesson labs on a real account.
        </p>
        <div className="meta pg-stats">
          <span><b>{tableCount}</b> tables</span>
          <span><b>{rowCount.toLocaleString('en-IN')}</b> rows</span>
          <span><b>{solved}</b> / {EXERCISES.length} exercises solved</span>
        </div>
      </header>

      <div className="pg-tabs" role="tablist" aria-label="Playground sections">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <div className="pg-layout">
        <div className={`pg-col pg-col-tables${tab === 'tables' ? ' on' : ''}`}>
          <TableBrowser schema={schema} onPreview={preview} onInsert={insertName} />
          <SavedQueriesPanel onLoad={loadSql} />
        </div>
        <div className={`pg-col pg-col-editor${tab === 'editor' ? ' on' : ''}`}>
          <EditorPanel sql={sql} onChange={setSql} onRun={run} schema={schema} boot={boot} bootError={bootError} running={running}
            onSave={name => SavedQueries.save(name, sql)} onReset={reset} onClear={() => setSql('')} />
          <ResultGrid result={result} error={error} running={running}
            placeholder={boot === 'ready' ? 'Run a query to see results.' : 'Results appear here once the engine is ready.'} />
        </div>
        <div className={`pg-col pg-col-exercises${tab === 'exercises' ? ' on' : ''}`}>
          <ExercisePanel db={db} getSql={() => sqlRef.current} runLearner={runSql} onLoadSql={loadSql} />
        </div>
      </div>
    </div>
  );
}
