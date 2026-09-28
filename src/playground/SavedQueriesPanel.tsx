// Saved queries list under the table browser: load into the editor or delete.
import { useSyncExternalStore } from 'react';
import { SavedQueries } from './savedQueries';

interface Props { onLoad: (sql: string) => void }

export default function SavedQueriesPanel({ onLoad }: Props) {
  const items = useSyncExternalStore(SavedQueries.subscribe, SavedQueries.list);
  return (
    <section className="panel pg-saved" aria-label="Saved queries">
      <div className="panel-head"><h3>Saved queries</h3><span className="overline">{items.length}</span></div>
      {items.length === 0
        ? <p className="empty">Nothing saved yet. Write a query and press “Save query”.</p>
        : (
          <ul className="pg-saved-list">
            {items.map(q => (
              <li key={q.id}>
                <button type="button" className="pg-saved-load" title={q.sql} onClick={() => onLoad(q.sql)}>
                  <b>{q.name}</b>
                  <span>{new Date(q.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </button>
                <button type="button" className="icon-btn" aria-label={`Delete ${q.name}`} onClick={() => SavedQueries.remove(q.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}
