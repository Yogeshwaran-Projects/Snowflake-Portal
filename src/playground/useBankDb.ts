// Boots the in-browser engine with the bank dataset once per mounted
// playground and exposes its schema. Booting DuckDB-wasm takes seconds, so
// the page renders the browser/exercises immediately and shows a boot state
// in the editor instead of blocking.
import { useCallback, useEffect, useState } from 'react';
import { createDb, type SqlDb } from '../sql/engine';
import type { SchemaTable } from '../types';
import { BANK } from './bank';

export type BootState = 'booting' | 'ready' | 'failed';

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function useBankDb() {
  const [db, setDb] = useState<SqlDb | null>(null);
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [boot, setBoot] = useState<BootState>('booting');
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    // `alive` guards StrictMode's mount→unmount→mount in dev: the first boot
    // resolves after its cleanup ran and MUST be closed, not adopted.
    let alive = true;
    let handle: SqlDb | null = null;
    createDb(BANK).then(async d => {
      if (!alive) { await d.close(); return; }
      handle = d;
      const tables = await d.schema();
      if (!alive) return;
      setDb(d); setSchema(tables); setBoot('ready');
    }).catch((e: unknown) => {
      if (alive) { setBootError(errorMessage(e)); setBoot('failed'); }
    });
    return () => { alive = false; handle?.close().catch(() => { /* already gone */ }); };
  }, []);

  // Row counts in the table browser must follow learner DML (INSERT/DELETE),
  // so the page calls this after every run, not just after reset.
  const refreshSchema = useCallback(async () => {
    if (!db) return;
    try { setSchema(await db.schema()); } catch { /* keep the last good schema */ }
  }, [db]);

  return { db, schema, boot, bootError, refreshSchema };
}
