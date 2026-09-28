// In-browser SQL engine for the lessons and the playground, on DuckDB-Wasm.
//
// Isolation: every createDb() gets its own connection AND its own attached
// in-memory database (`ATTACH ':memory:' AS sl_db_<n>; USE sl_db_<n>`). The
// wasm instance is shared (bundle.ts) — booting one per worksheet would cost
// ~30 MB and seconds per lesson — but lesson tables never leak into the
// playground because unqualified names resolve inside the USE'd database.
// Known limitation: a learner who writes `USE memory` or `sl_db_2.main.t`
// explicitly can reach another worksheet's tables. Accepted deliberately —
// this is a study portal, not a multi-tenant system.
//
// Ops on one SqlDb are serialised through a small queue so a reset() issued
// mid-run() cannot interleave with its statements (the worker is sequential
// per statement, not per run()).
import type { Cell, QueryResult, SchemaColumn, SchemaTable, Tables } from '../types';
import { getEngine, type ArrowTable } from './bundle';
import { splitStatements } from './split';
import { createStatements, quoteIdent, quoteText } from './load';
import { readableError, tableToResult } from './convert';

export interface SqlDb {
  /** Runs one or more statements; returns the LAST statement's result. Throws Error with a readable message on failure. */
  run(sql: string): Promise<QueryResult>;
  /** Tables with columns and row counts, for the Schema tab, table browser and autocomplete. */
  schema(): Promise<SchemaTable[]>;
  /** Drops everything and reloads the original tables (playground "Reset data"). */
  reset(): Promise<void>;
  close(): Promise<void>;
}

type Exec = (sql: string) => Promise<ArrowTable>;

let nextDbId = 0;

/** Boots the shared engine early (e.g. on app start) so the first Run does not pay the wasm download. */
export function warmUp(): void {
  getEngine().catch((err: unknown) => {
    // Not fatal: createDb() retries the boot and surfaces the real error to the worksheet.
    console.warn('[SQL] warm-up FAILED (engine boot) — first Run will retry:', err);
  });
}

/** Creates an ISOLATED in-browser database loaded with `tables`. */
export async function createDb(tables: Tables): Promise<SqlDb> {
  const engine = await getEngine();
  const conn = await engine.connect();
  // Fresh name on EVERY attach, including reset(): re-attaching under a name
  // that was detached moments earlier in the same connection trips DuckDB's
  // "Database name … was already used by a different database for this meta
  // transaction" INTERNAL error (seen on reset() after a learner's BEGIN),
  // and an INTERNAL error invalidates the whole shared instance.
  let name = '';
  const enqueue = makeQueue();

  const exec: Exec = sql => conn.query(sql).catch((err: unknown) => { throw readableError(err); });

  const load = async (): Promise<void> => {
    name = `sl_db_${++nextDbId}`;
    await exec(`ATTACH ':memory:' AS ${name}`);
    await exec(`USE ${name}`);
    for (const [table, def] of Object.entries(tables)) {
      for (const stmt of createStatements(table, def)) await exec(stmt);
    }
  };

  const detach = async (): Promise<void> => {
    // ALWAYS roll back first. A learner's open `BEGIN` survives USE + DETACH
    // and then breaks the re-attach ("a single transaction can only write
    // to a single attached database"). With no transaction open, ROLLBACK
    // fails harmlessly — the worker bundle console.logs that failure, which
    // is accepted noise on reset()/close() rather than a stale transaction.
    await conn.query('ROLLBACK').catch(() => undefined);
    await exec('USE memory');
    await exec(`DETACH ${name}`);
  };

  try {
    await load();
  } catch (err) {
    await conn.close().catch(() => undefined);
    throw err;
  }

  // Guard every op after close(): a query on a disconnected connection id
  // reaches the wasm side and dies with "memory access out of bounds"
  // instead of a message a caller can show.
  let closed = false;
  const open = (): void => {
    if (closed) throw new Error('This worksheet has been closed.');
  };

  return {
    run: sql => enqueue(async () => {
      open();
      const stmts = splitStatements(sql);
      const first = stmts[0];
      if (first === undefined) throw new Error('Nothing to run — type a query first.');
      const t0 = performance.now();
      let last = await exec(first);
      for (const stmt of stmts.slice(1)) last = await exec(stmt);
      return tableToResult(last, Math.round(performance.now() - t0));
    }),
    schema: () => enqueue(() => { open(); return readSchema(name, exec); }),
    reset: () => enqueue(async () => { open(); await detach(); await load(); }),
    close: () => enqueue(async () => {
      if (closed) return;
      closed = true;
      await detach();
      await conn.close();
    }),
  };
}

async function readSchema(dbName: string, exec: Exec): Promise<SchemaTable[]> {
  // table_oid order = creation order, so the Schema tab lists tables the way
  // the lesson JSON declares them (alphabetical would put `accounts` before
  // `customers` in the JOIN lesson).
  const meta = tableToResult(await exec(
    `SELECT table_name, column_name, data_type FROM duckdb_columns()
     WHERE database_name = ${quoteText(dbName)} AND schema_name = 'main'
     ORDER BY table_oid, column_index`,
  ), 0);
  const byTable = new Map<string, SchemaColumn[]>();
  for (const row of meta.rows) {
    const table = String(row.table_name ?? '');
    const cols = byTable.get(table) ?? [];
    cols.push({ name: String(row.column_name ?? ''), type: displayType(String(row.data_type ?? '')) });
    byTable.set(table, cols);
  }
  if (byTable.size === 0) return [];
  const countSql = [...byTable.keys()]
    .map(t => `SELECT ${quoteText(t)} AS t, COUNT(*) AS n FROM ${quoteIdent(t)}`)
    .join(' UNION ALL ');
  const counts = tableToResult(await exec(countSql), 0);
  const countOf = new Map(counts.rows.map(r => [String(r.t ?? ''), Number(r.n ?? 0)]));
  return [...byTable].map(([table, columns]) => ({ name: table, rowCount: countOf.get(table) ?? 0, columns }));
}

/** DuckDB type names → the Snowflake vocabulary the lessons teach (BIGINT/DOUBLE both read as NUMBER). */
function displayType(duck: string): string {
  if (/^(TINYINT|SMALLINT|INTEGER|BIGINT|HUGEINT|UTINYINT|USMALLINT|UINTEGER|UBIGINT|UHUGEINT|FLOAT|REAL|DOUBLE|DECIMAL)/i.test(duck)) return 'NUMBER';
  if (/^TIMESTAMP/i.test(duck)) return 'TIMESTAMP';
  return duck;
}

/** True when two results hold the same VALUES, ignoring column names and row order. */
export function sameResult(a: QueryResult, b: QueryResult): boolean {
  if (a.columns.length !== b.columns.length || a.rows.length !== b.rows.length) return false;
  const keys = (r: QueryResult): string[] =>
    r.rows.map(row => r.columns.map(c => normalise(row[c] ?? null)).join('\u0001')).sort();
  const ka = keys(a);
  const kb = keys(b);
  return ka.every((k, i) => k === kb[i]);
}

/** Numbers compare at 2 dp so AVG float noise (33.333333 vs 33.33) is not a wrong answer. */
function normalise(v: Cell): string {
  if (v === null) return '\u0000';
  if (typeof v === 'number') {
    const fixed = v.toFixed(2);
    return 'n:' + (fixed === '-0.00' ? '0.00' : fixed);
  }
  return 's:' + v;
}

export function formatCell(v: Cell): string {
  return v === null ? 'NULL' : String(v);
}

/** Serialises async jobs: each waits for the previous to settle; a failed job does not poison the chain. */
function makeQueue(): <T>(job: () => Promise<T>) => Promise<T> {
  let tail: Promise<unknown> = Promise.resolve();
  return job => {
    const next = tail.then(job, job);
    tail = next.catch(() => undefined);
    return next;
  };
}
