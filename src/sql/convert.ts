// Arrow → QueryResult conversion and error tidying. Pure functions.
//
// Conversion rules (what every consumer — grid, challenge checker, tests —
// can rely on):
//   BigInt            → number
//   DATE              → 'YYYY-MM-DD'
//   TIMESTAMP         → 'YYYY-MM-DD HH:MM:SS'
//   DECIMAL           → number (scale applied)
//   BOOLEAN           → 'TRUE' / 'FALSE'   (Snowflake spelling, not JS true/false)
//   NULL              → null
//   anything else     → its string form (lists, structs, intervals)
// Column order is the SELECT order; duplicate names get _1, _2 suffixes so a
// row object never silently drops a column.
//
// apache-arrow is duckdb-wasm's dependency, NOT the portal's, so this file
// imports it as types only and discriminates by the numeric `typeId` (the
// Arrow `Type` enum, stable across releases: Decimal=7, Date=8, Timestamp=10).
import type { DataType, Table } from 'apache-arrow';
import type { Cell, QueryResult } from '../types';

const TYPE_DECIMAL = 7;
const TYPE_DATE = 8;
const TYPE_TIMESTAMP = 10;

type Converter = (v: unknown) => Cell;

export function tableToResult(table: Table, ms: number): QueryResult {
  const names = dedupeNames(table.schema.fields.map(f => f.name));
  const cols = table.schema.fields.map((field, i) => ({
    name: names[i] ?? field.name,
    vector: table.getChildAt(i),
    convert: converterFor(field.type),
  }));
  const rows: Record<string, Cell>[] = [];
  for (let r = 0; r < table.numRows; r++) {
    const row: Record<string, Cell> = {};
    for (const col of cols) row[col.name] = col.vector ? col.convert(col.vector.get(r) as unknown) : null;
    rows.push(row);
  }
  return { columns: cols.map(c => c.name), rows, ms };
}

function dedupeNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map(name => {
    const n = seen.get(name) ?? 0;
    seen.set(name, n + 1);
    return n === 0 ? name : `${name}_${n}`;
  });
}

function converterFor(type: DataType): Converter {
  // Arrow JS hands DATE and TIMESTAMP over as epoch milliseconds (numbers),
  // so the type — not the value — decides between a number and a date string.
  if (type.typeId === TYPE_DATE) return v => (typeof v === 'number' ? isoDate(v) : plain(v));
  if (type.typeId === TYPE_TIMESTAMP) return v => (typeof v === 'number' ? isoDateTime(v) : plain(v));
  if (type.typeId === TYPE_DECIMAL) {
    const scale = 'scale' in type && typeof type.scale === 'number' ? type.scale : 0;
    return v => decimalToNumber(v, scale);
  }
  return plain;
}

function plain(v: unknown): Cell {
  if (v === null || v === undefined) return null;
  switch (typeof v) {
    case 'number': return v;
    case 'string': return v;
    case 'bigint': return Number(v);
    case 'boolean': return v ? 'TRUE' : 'FALSE';
    default: break;
  }
  if (v instanceof Date) return isoDateTime(v.getTime());
  if (v instanceof Uint32Array) return decimalToNumber(v, 0);
  return String(v);
}

function isoDate(ms: number): Cell {
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function isoDateTime(ms: number): Cell {
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 19).replace('T', ' ');
}

/** Arrow decimals are 128-bit two's-complement little-endian words (Uint32Array of 4). */
function decimalToNumber(v: unknown, scale: number): Cell {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v / 10 ** scale;
  if (typeof v === 'bigint') return Number(v) / 10 ** scale;
  if (!(v instanceof Uint32Array)) return plain(v);
  let n = 0n;
  for (let i = v.length - 1; i >= 0; i--) n = (n << 32n) | BigInt(v[i] ?? 0);
  const bits = BigInt(v.length * 32);
  if (n >> (bits - 1n)) n -= 1n << bits; // sign bit set → negative
  return Number(n) / 10 ** scale;
}

/**
 * DuckDB errors arrive as "Catalog Error: …!\nDid you mean "x"?\n\nLINE 1: …\n   ^".
 * Keep the headline plus any hint line; drop the LINE/caret dump, which
 * points into OUR statement slice, not the learner's editor.
 */
export function readableError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const kept: string[] = [];
  lines.forEach((line, i) => {
    if (i === 0 || /^Candidate bindings/i.test(line)) kept.push(line);
    else if (/^Did you mean/i.test(line)) {
      const hint = scrubForeignDbHint(line);
      if (hint) kept.push(hint);
    }
  });
  return new Error(kept.join(' ') || 'Query failed.');
}

/**
 * The catalog search for "Did you mean" spans EVERY attached database, so a
 * typo in one worksheet suggests `sl_db_3.query_log` from another — which
 * breaks the isolation createDb() promises and reads as gibberish to a
 * learner. Drop candidates that live in a sibling sl_db_<n>; drop the whole
 * hint when nothing local remains.
 * DuckDB formats candidates as "a", "a or b", "a, b, or c".
 */
function scrubForeignDbHint(line: string): string | null {
  const m = /^Did you mean "(.*)"\?$/.exec(line);
  if (!m) return line;
  const candidates = (m[1] ?? '')
    .split(/,\s*|\s+or\s+/)
    .map(c => c.trim().replace(/^or\s+/, '')) // ", or c" splits into "or c"
    .filter(c => c && !/^sl_db_\d+\./.test(c));
  if (candidates.length === 0) return null;
  const last = candidates[candidates.length - 1] ?? '';
  const joined = candidates.length === 1 ? last
    : candidates.length === 2 ? `${candidates[0]} or ${last}`
    : `${candidates.slice(0, -1).join(', ')}, or ${last}`;
  return `Did you mean "${joined}"?`;
}
