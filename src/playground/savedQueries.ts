// Learner-saved playground queries, kept in this browser's localStorage
// (same single-learner trade-off as lib/progress.ts: no sync, no accounts).
// If storage is blocked the list still works in memory for this page.
// The list is replaced immutably on every change so useSyncExternalStore
// sees a new reference ONLY when something actually changed.

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  /** ISO timestamp, display only. */
  savedAt: string;
}

const KEY = 'sl-playground-saved-v1';

function load(): SavedQuery[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((q): q is SavedQuery =>
      typeof q === 'object' && q !== null && typeof (q as SavedQuery).id === 'string' && typeof (q as SavedQuery).sql === 'string');
  } catch { return []; }
}

let items: SavedQuery[] = load();
const listeners = new Set<() => void>();

function commit(next: SavedQuery[]) {
  items = next;
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* blocked: in-memory only */ }
  listeners.forEach(fn => fn());
}

export const SavedQueries = {
  list: () => items,
  save(name: string, sql: string) {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    commit([{ id, name: name.trim() || 'Untitled query', sql, savedAt: new Date().toISOString() }, ...items]);
  },
  remove(id: string) { commit(items.filter(q => q.id !== id)); },
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
};
