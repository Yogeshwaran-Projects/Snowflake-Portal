// "Where does this course pick up?" — shared by the Home cards and the
// top-bar switcher so both send the learner to the SAME lesson.
import { findLesson, lessonHash, lessonsOf } from '../courses';
import type { Course, LessonMeta } from '../types';
import { Progress } from './progress';

/** Last lesson opened in the course, if it still exists in the outline. */
export function lastVisitedLesson(course: Course): LessonMeta | undefined {
  const id = Progress.lastVisited(course.id);
  return id === undefined ? undefined : findLesson(course, id);
}

/** Hash of the last lesson opened, or of lesson one for a course never opened. */
export function continueHash(course: Course): string {
  const lesson = lastVisitedLesson(course) ?? lessonsOf(course)[0];
  return lesson ? lessonHash(course.id, lesson.id) : '#home';
}
