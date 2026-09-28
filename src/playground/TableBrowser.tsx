// Left-hand table browser: every table with its live row count, expandable
// to columns. Column types and notes come from the dataset definition (the
// NUMBER/VARCHAR/DATE vocabulary the lessons use) rather than the engine's
// physical types; tables the learner creates herself fall back to the
// engine's schema because the dataset knows nothing about them.
import { useState } from 'react';
import type { SchemaTable } from '../types';
import { BANK } from './bank';

interface Props {
  schema: SchemaTable[];
  onPreview: (table: string) => void;
  onInsert: (table: string) => void;
}

interface Col { name: string; type: string; note?: string }

function columnsFor(t: SchemaTable): Col[] {
  const def = BANK[t.name];
  if (!def) return t.columns.map(c => ({ name: c.name, type: c.type }));
  return def.columns.map(([name, type, note]) => note ? { name, type, note } : { name, type });
}

export default function TableBrowser({ schema, onPreview, onInsert }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  // Before the engine is ready, list the dataset so the learner can read the schema while waiting.
  const tables: SchemaTable[] = schema.length
    ? schema
    : Object.entries(BANK).map(([name, t]) => ({ name, rowCount: t.rows.length, columns: t.columns.map(([n, ty]) => ({ name: n, type: ty })) }));

  return (
    <section className="panel pg-tables" aria-label="Table browser">
      <div className="panel-head"><h3>Tables</h3><span className="overline">{tables.length} tables</span></div>
      <ul className="pg-table-list">
        {tables.map(t => {
          const expanded = open === t.name;
          return (
            <li key={t.name} className={expanded ? 'open' : ''}>
              <button type="button" className="pg-table-row" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : t.name)}>
                <span className="pg-caret" aria-hidden="true">{expanded ? '▾' : '▸'}</span>
                <code>{t.name}</code>
                <span className="pg-count">{t.rowCount.toLocaleString('en-IN')} rows</span>
              </button>
              {expanded && (
                <div className="pg-table-detail">
                  <ul className="pg-cols">
                    {columnsFor(t).map(c => (
                      <li key={c.name}>
                        <code>{c.name}</code>
                        <span className="pg-type">{c.type}</span>
                        {c.note && <span className="pg-note">{c.note}</span>}
                      </li>
                    ))}
                  </ul>
                  <div className="examples">
                    <button type="button" onClick={() => onPreview(t.name)}>Preview</button>
                    <button type="button" onClick={() => onInsert(t.name)}>Insert name</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
