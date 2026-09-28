// The 40 graded playground exercises in id order. Split across two files
// only to stay within the file-length rule; import from HERE.
import { ADVANCED_EXERCISES } from './exercises-advanced';
import { BASIC_EXERCISES } from './exercises-basic';

export type { Exercise, Level } from './exercise-types';
export { LEVELS } from './exercise-types';

export const EXERCISES = [...BASIC_EXERCISES, ...ADVANCED_EXERCISES];

/** Distinct topics in first-seen order — drives the topic filter. */
export const TOPICS = [...new Set(EXERCISES.map(e => e.topic))];
