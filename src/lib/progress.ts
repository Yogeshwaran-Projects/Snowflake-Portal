// Learner progress (completed lessons, best quiz scores, last lesson opened
// per course, solved playground exercises), kept in this browser's
// localStorage. NOT synced across devices — accepted deliberately for a
// single-learner portal with no accounts. If storage is blocked the portal
// still works; progress just resets on reload.
//
// Key scheme (one flat `completed` list and one `quiz` map for every course):
//   fundamentals, lesson 1-1  → '1-1'        (bare: the pre-multi-course key)
//   sql | coco | cortex, 1-1  → 'sql/1-1'
// Keep the Fundamentals keys bare. Prefixing them would orphan every tick
// and quiz score already saved under 'sl-progress-v1' — with no error.
import { COURSES, findCourse, lessonsOf } from '../courses';

const KEY = 'sl-progress-v1';
const FUNDAMENTALS_ID = 'fundamentals';

interface State {
  completed: string[];
  quiz: Record<string, { score: number; total: number }>;
  exercises: string[];
  /** courseId → lessonId last opened. Added with multi-course; old states lack it. */
  last: Record<string, string>;
}

let state: State = { completed: [], quiz: {}, exercises: [], last: {} };
try {
  state = { ...state, ...(JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<State>) };
  state.exercises ??= [];
  state.last ??= {};
} catch { /* unreadable or blocked: start fresh */ }

let version = 0;
const listeners = new Set<() => void>();
function save() {
  version += 1;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* blocked: in-memory only */ }
  listeners.forEach(fn => fn());
}

/** Storage key for one lesson's completion and quiz score. See the key scheme above. */
export function progressKey(courseId: string, lessonId: string): string {
  return courseId === FUNDAMENTALS_ID ? lessonId : `${courseId}/${lessonId}`;
}

function countDone(courseId: string): number {
  const course = findCourse(courseId);
  if (!course) return 0;
  // Counted against the outline, not the raw list: a key for a lesson that
  // was later removed must not push a course past 100%.
  return lessonsOf(course).filter(l => state.completed.includes(progressKey(courseId, l.id))).length;
}

export const Progress = {
  isDone: (courseId: string, lessonId: string) => state.completed.includes(progressKey(courseId, lessonId)),
  markDone(courseId: string, lessonId: string) {
    const key = progressKey(courseId, lessonId);
    if (!state.completed.includes(key)) { state.completed.push(key); save(); }
  },
  /** Completed lessons in one course, or across every course when no id is given. */
  doneCount: (courseId?: string) =>
    courseId === undefined ? COURSES.reduce((n, c) => n + countDone(c.id), 0) : countDone(courseId),
  /** Whole-number percent complete for one course (0 for an unknown course). */
  percent(courseId: string) {
    const course = findCourse(courseId);
    const total = course ? lessonsOf(course).length : 0;
    return total === 0 ? 0 : Math.round((countDone(courseId) / total) * 100);
  },
  lastVisited: (courseId: string): string | undefined => state.last[courseId],
  setLastVisited(courseId: string, lessonId: string) {
    if (state.last[courseId] !== lessonId) { state.last[courseId] = lessonId; save(); }
  },
  /** `key` is a progressKey(), so Fundamentals scores stay where they always were. */
  bestScore: (key: string) => state.quiz[key],
  saveScore(key: string, score: number, total: number) {
    const prev = state.quiz[key];
    if (!prev || score > prev.score) { state.quiz[key] = { score, total }; save(); }
  },
  isSolved: (exerciseId: string) => state.exercises.includes(exerciseId),
  markSolved(exerciseId: string) { if (!state.exercises.includes(exerciseId)) { state.exercises.push(exerciseId); save(); } },
  solvedCount: () => state.exercises.length,
  /** Bumps on every save: ONE primitive snapshot for components that read several counters. */
  version: () => version,
  /** Re-render hook: returns an unsubscribe function. */
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
};
