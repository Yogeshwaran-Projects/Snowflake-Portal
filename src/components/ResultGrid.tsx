// Result panel under a worksheet: status bar, error box or data grid.
// Test hooks: [data-out] on the root, [data-status] and [data-time] in the bar.
import type { Cell, QueryResult } from '../types';
import '../styles/editor.css';

export interface ResultGridProps {
  result: QueryResult | null;
  error: string | null;
  running: boolean;
  /** Shown before the first run. */
  placeholder?: string;
}

/** Rows rendered at most. The lessons hold ~15 rows; the cap protects the playground from `SELECT * FROM range(1e6)`. */
const ROW_CAP = 500;
/** Lakh/crore grouping — the portal's audience reads 1,23,456 naturally. */
const numberFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 4 });
/** Identifier-like columns stay raw: "1,02,345" is not an account number anyone recognises. */
const ID_LIKE = /(id|_no|year)$/i;

const ERROR_HINT = "Check the spelling of table and column names, and that text values are in 'single quotes'.";

export default function ResultGrid({ result, error, running, placeholder }: ResultGridProps) {
  return (
    <div className="results" data-out="">
      <div className="results-bar">
        <StatusLabel result={result} error={error} running={running} />
        <span data-time="">{result && !error && !running ? `${result.ms} ms` : ''}</span>
      </div>
      {error !== null ? (
        <div className="empty bad">
          <b>{error}</b>
          <span className="hint">{ERROR_HINT}</span>
        </div>
      ) : result ? (
        <Grid result={result} />
      ) : (
        <div className="empty">{placeholder ?? 'Run a query to see results.'}</div>
      )}
    </div>
  );
}

function StatusLabel({ result, error, running }: Omit<ResultGridProps, 'placeholder'>) {
  if (running) return <span data-status="">Running…</span>;
  if (error !== null) return <span data-status="" className="dot bad">Query failed</span>;
  if (!result) return <span data-status="">Ready</span>;
  const n = result.rows.length;
  const label = n === 0 ? 'Query ran' : n === 1 ? '1 row' : `${numberFormat.format(n)} rows`;
  return <span data-status="" className="dot ok">{label}</span>;
}

function Grid({ result }: { result: QueryResult }) {
  const { columns, rows } = result;
  if (columns.length === 0) return <div className="empty">Query ran. No rows to show.</div>;
  const shown = rows.slice(0, ROW_CAP);
  const numeric = columns.map(c =>
    shown.some(r => typeof r[c] === 'number') && shown.every(r => r[c] === null || typeof r[c] === 'number'),
  );
  return (
    <>
      <div className="grid-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c, i) => <th key={i} className={numeric[i] ? 'num' : undefined}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={columns.length} className="none">No rows returned.</td></tr>
            ) : shown.map((row, r) => (
              <tr key={r}>
                {columns.map((c, i) => (
                  <td key={i} className={numeric[i] ? 'num' : undefined}>{renderCell(row[c] ?? null, c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > ROW_CAP && (
        <div className="cap-note">Showing {ROW_CAP} of {numberFormat.format(rows.length)} rows</div>
      )}
    </>
  );
}

function renderCell(v: Cell, column: string) {
  if (v === null) return <span className="null">NULL</span>;
  if (typeof v === 'number') return ID_LIKE.test(column) && Number.isInteger(v) ? String(v) : numberFormat.format(v);
  return v;
}
