// Compatibility re-export of the Snowflake Fundamentals outline. The app
// reads courses from ./courses; this file stays because the lesson validator
// (outside this repo) imports `ALL_LESSONS` from here — deleting it or
// renaming the export breaks that script, not the build.
import { FUNDAMENTALS, FUNDAMENTALS_MODULES } from './courses/fundamentals';
import type { CourseModule, LessonMeta } from './types';

export const COURSE_TITLE = FUNDAMENTALS.title;

export const MODULES: CourseModule[] = FUNDAMENTALS_MODULES;

/** Snowflake Fundamentals lessons ONLY — each id has a file at public/lessons/<id>.html. */
export const ALL_LESSONS: LessonMeta[] = MODULES.flatMap(m => m.lessons);
