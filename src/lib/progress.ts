// Learner progress (completed lessons, best quiz scores, solved playground
// exercises), kept in this browser's localStorage. NOT synced across
// devices — accepted deliberately for a single-learner portal with no
// accounts. If storage is blocked the portal still works; progress just
// resets on reload.

const KEY = 'sl-progress-v1';

interface State {
  completed: string[];
  quiz: Record<string, { score: number; total: number }>;
  exercises: string[];
}

let state: State = { completed: [], quiz: {}, exercises: [] };
try {
  state = { ...state, ...(JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<State>) };
  state.exercises ??= [];
} catch { /* unreadable or blocked: start fresh */ }

const listeners = new Set<() => void>();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* blocked: in-memory only */ }
  listeners.forEach(fn => fn());
}

export const Progress = {
  isDone: (id: string) => state.completed.includes(id),
  markDone(id: string) { if (!state.completed.includes(id)) { state.completed.push(id); save(); } },
  doneCount: () => state.completed.length,
  bestScore: (id: string) => state.quiz[id],
  saveScore(id: string, score: number, total: number) {
    const prev = state.quiz[id];
    if (!prev || score > prev.score) { state.quiz[id] = { score, total }; save(); }
  },
  isSolved: (exerciseId: string) => state.exercises.includes(exerciseId),
  markSolved(exerciseId: string) { if (!state.exercises.includes(exerciseId)) { state.exercises.push(exerciseId); save(); } },
  solvedCount: () => state.exercises.length,
  /** Re-render hook: returns an unsubscribe function. */
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
};
