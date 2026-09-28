// Turns a lesson's `Tables` into DDL + INSERT statements. Pure string
// building, no DuckDB — so the type mapping unit-tests without wasm and the
// Node validator in the scratchpad can replay the exact same mapping.
//
// Type mapping (the contract the lesson SQL was validated against):
//   NUMBER  → BIGINT when every non-null value is a safe integer (ids, counts)
//           → DOUBLE otherwise (amounts, rates)
//   VARCHAR → VARCHAR
//   DATE    → DATE (rows carry 'YYYY-MM-DD' strings; DuckDB casts on insert)
// Keep BIGINT for integer columns: `amount / 2` is still float division in
// DuckDB, while DOUBLE ids would print as 1.0-style values in some functions
// and break `GROUP BY` intent in learners' heads.
import type { Cell, ColumnType, TableDef } from '../types';

/** Rows per INSERT. Small lessons load in one round-trip; large playground tables stay under the parser's literal budget. */
const ROWS_PER_INSERT = 200;

export function quoteIdent(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"';
}

/** Single-quoted literal. Only `'` is special in DuckDB standard strings (no backslash escapes). */
export function quoteText(text: string): string {
  return "'" + text.replace(/'/g, "''") + "'";
}

export function duckType(type: ColumnType, values: readonly Cell[]): string {
  switch (type) {
    case 'VARCHAR': return 'VARCHAR';
    case 'DATE': return 'DATE';
    case 'NUMBER':
      return values.every(v => v === null || (typeof v === 'number' && Number.isSafeInteger(v))) ? 'BIGINT' : 'DOUBLE';
  }
}

function literal(v: Cell): string {
  if (v === null) return 'NULL';
  // NaN/Infinity have no portable literal; NULL is the honest value, and the
  // lesson JSON (authored by hand) never contains them.
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  return quoteText(v);
}

/** CREATE TABLE + batched INSERTs for one table. A missing cell (short row) becomes NULL. */
export function createStatements(name: string, def: TableDef): string[] {
  const table = quoteIdent(name);
  const columns = def.columns.map(([col, type], i) => {
    const values = def.rows.map(row => row[i] ?? null);
    return `${quoteIdent(col)} ${duckType(type, values)}`;
  });
  const stmts = [`CREATE TABLE ${table} (${columns.join(', ')})`];
  for (let at = 0; at < def.rows.length; at += ROWS_PER_INSERT) {
    const tuples = def.rows
      .slice(at, at + ROWS_PER_INSERT)
      .map(row => '(' + def.columns.map((_, c) => literal(row[c] ?? null)).join(', ') + ')');
    stmts.push(`INSERT INTO ${table} VALUES ${tuples.join(', ')}`);
  }
  return stmts;
}
