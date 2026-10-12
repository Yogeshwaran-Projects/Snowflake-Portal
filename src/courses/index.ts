// Course registry: the ONE list the shell, router and progress store read.
// Order here is the order of the Home cards and the course switcher.
import type { Course, LessonMeta } from '../types';
import { COCO } from './coco';
import { CORTEX } from './cortex';
import { FUNDAMENTALS } from './fundamentals';
import { SQL } from './sql';

export const COURSES: readonly Course[] = [FUNDAMENTALS, SQL, COCO, CORTEX];

export const DEFAULT_COURSE: Course = FUNDAMENTALS;

export function findCourse(courseId: string): Course | undefined {
  return COURSES.find(c => c.id === courseId);
}

export function lessonsOf(course: Course): LessonMeta[] {
  return course.modules.flatMap(m => m.lessons);
}

export function findLesson(course: Course, lessonId: string): LessonMeta | undefined {
  return lessonsOf(course).find(l => l.id === lessonId);
}

/** The lesson after `lessonId` in course order, or undefined on the last one. */
export function nextLesson(course: Course, lessonId: string): LessonMeta | undefined {
  const all = lessonsOf(course);
  const i = all.findIndex(l => l.id === lessonId);
  return i < 0 ? undefined : all[i + 1];
}

export function totalMinutes(course: Course): number {
  return lessonsOf(course).reduce((sum, l) => sum + l.mins, 0);
}

/** Canonical link to a lesson. Fundamentals ALSO answers to bare '#1-1' (old bookmarks). */
export function lessonHash(courseId: string, lessonId: string): string {
  return `#${courseId}/${lessonId}`;
}
