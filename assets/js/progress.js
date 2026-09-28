// Learner progress (completed lessons, best quiz scores), kept in this
// browser's localStorage. NOT synced across devices — accepted deliberately
// for a single-learner portal with no accounts. If storage is blocked the
// portal still works; progress just resets on reload.
window.Progress = (() => {
  const KEY = 'sl-progress-v1';
  let state = { completed: [], quiz: {} };
  try { state = { ...state, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { /* unreadable or blocked: start fresh */ }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* blocked: in-memory only */ } };

  return {
    isDone: id => state.completed.includes(id),
    markDone(id) { if (!state.completed.includes(id)) { state.completed.push(id); save(); } },
    doneCount: () => state.completed.length,
    bestScore: id => state.quiz[id],
    saveScore(id, score, total) {
      const prev = state.quiz[id];
      if (!prev || score > prev.score) { state.quiz[id] = { score, total }; save(); }
    },
  };
})();
