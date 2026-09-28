// DuckDB-Wasm boot. ONE AsyncDuckDB per page, created lazily and shared by
// every SqlDb (each SqlDb isolates itself with its own attached database —
// see engine.ts). The wasm binary and its worker are served from OUR origin
// via Vite `?url` assets: the portal sits behind a sign-in middleware and MUST
// NOT depend on jsDelivr being reachable, and a pinned 1.32.0 bundle is what
// the lesson SQL was validated against.
import * as duckdb from '@duckdb/duckdb-wasm';
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import ehWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

export type Engine = duckdb.AsyncDuckDB;
export type Connection = duckdb.AsyncDuckDBConnection;
/** Whatever `Connection.query` resolves to — named once so convert.ts needs no apache-arrow value import. */
export type ArrowTable = Awaited<ReturnType<Connection['query']>>;

let booting: Promise<Engine> | null = null;

/**
 * Returns the shared engine, booting it on first call. A failed boot is
 * forgotten so the next createDb() retries instead of replaying the same
 * rejected promise forever (e.g. a flaky first wasm fetch).
 */
export function getEngine(): Promise<Engine> {
  if (!booting) {
    booting = boot().catch((err: unknown) => {
      booting = null;
      throw err;
    });
  }
  return booting;
}

async function boot(): Promise<Engine> {
  // selectBundle picks `eh` on browsers with wasm exception handling (every
  // evergreen browser since 2022) and falls back to `mvp` elsewhere.
  const bundle = await duckdb.selectBundle({
    mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
    eh: { mainModule: ehWasm, mainWorker: ehWorker },
  });
  if (!bundle.mainWorker) throw new Error('duckdb: no worker bundle for this browser');
  const worker = new Worker(bundle.mainWorker);
  // WARNING level: the INFO stream logs every query text, which is noise in
  // the console and would echo learners' SQL into browser logs.
  const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  // castBigIntToDouble / castDecimalToDouble: results arrive as Float64 so
  // COUNT(*), SUM(BIGINT) and `amount * 1.1` (DECIMAL) are plain JS numbers.
  // convert.ts still handles BigInt/Decimal defensively for anything the cast
  // does not cover (HUGEINT inside structs, etc.).
  await db.open({ path: ':memory:', query: { castBigIntToDouble: true, castDecimalToDouble: true } });
  return db;
}
