// Editor panel: SqlEditor plus the action bar (Run, Save query, Clear, Reset
// data). Both destructive-ish flows (save name, reset confirm) render INLINE
// in the panel — window.confirm/prompt are blocked in some embedded browsers
// and look nothing like the portal.
import { useState } from 'react';
import SqlEditor from '../components/SqlEditor';
import type { SchemaTable } from '../types';
import type { BootState } from './useBankDb';

interface Props {
  sql: string;
  onChange: (sql: string) => void;
  onRun: () => void;
  schema: SchemaTable[];
  boot: BootState;
  bootError: string | null;
  running: boolean;
  onSave: (name: string) => void;
  onReset: () => Promise<void>;
  onClear: () => void;
}

export default function EditorPanel({ sql, onChange, onRun, schema, boot, bootError, running, onSave, onReset, onClear }: Props) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const ready = boot === 'ready';

  const save = () => { onSave(name); setName(''); setNaming(false); };
  const reset = async () => {
    setResetting(true);
    try { await onReset(); } finally { setResetting(false); setConfirmReset(false); }
  };

  return (
    <section className="panel pg-editor" aria-label="SQL editor">
      <div className="panel-head">
        <h3>Editor</h3>
        <span className={`pg-status ${boot}`} role="status" aria-live="polite">
          {boot === 'booting' && 'Starting the SQL engine…'}
          {boot === 'ready' && (running ? 'Running…' : 'Engine ready · Ctrl/Cmd+Enter runs')}
          {boot === 'failed' && 'Engine failed to start'}
        </span>
      </div>
      {boot === 'failed' && (
        <div className="empty bad" role="alert">
          The SQL engine could not start{bootError ? `: ${bootError}` : ''}. Reload the page; if it keeps failing, try a desktop browser — DuckDB needs WebAssembly.
        </div>
      )}
      <div className="ws pg-ws">
        <SqlEditor value={sql} onChange={onChange} onRun={onRun} schema={schema} minHeight={220} ariaLabel="SQL editor" />
      </div>
      <div className="pg-actions">
        <button type="button" className="btn btn-primary" data-run onClick={onRun} disabled={!ready || running}>
          {running ? 'Running…' : 'Run'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setNaming(v => !v)} disabled={!sql.trim()}>Save query</button>
        <button type="button" className="btn btn-secondary" onClick={onClear} disabled={!sql}>Clear</button>
        <button type="button" className="btn btn-secondary pg-reset" onClick={() => setConfirmReset(v => !v)} disabled={!ready}>Reset data</button>
      </div>
      {naming && (
        <form className="pg-inline" onSubmit={e => { e.preventDefault(); save(); }}>
          <label htmlFor="pg-save-name">Name</label>
          <input id="pg-save-name" type="text" value={name} placeholder="e.g. August depositors" maxLength={60}
            onChange={e => setName(e.target.value)} autoFocus />
          <button type="submit" className="btn btn-primary">Save</button>
          <button type="button" className="btn btn-secondary" onClick={() => setNaming(false)}>Cancel</button>
        </form>
      )}
      {confirmReset && (
        <div className="callout note pg-inline pg-confirm" role="alertdialog" aria-label="Confirm reset">
          <p>Reset all tables to the original bank data? Anything you inserted, updated or created will be lost. Saved queries are kept.</p>
          <div className="pg-confirm-actions">
            <button type="button" className="btn btn-primary" onClick={reset} disabled={resetting}>{resetting ? 'Resetting…' : 'Yes, reset'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmReset(false)} disabled={resetting}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
