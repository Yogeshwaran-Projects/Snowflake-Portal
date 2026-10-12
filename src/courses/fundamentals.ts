import type { Course, CourseModule } from '../types';

// Snowflake Fundamentals: the portal's ORIGINAL course. Its lesson files stay
// at public/lessons/<id>.html (no course folder) and its progress keys stay
// bare ('1-1'), so bookmarks and learner progress from before the portal
// became multi-course keep working. Keep both ALONE — moving the files into
// /lessons/fundamentals/ would 404 every lesson, and prefixing the keys would
// silently wipe every learner's ticks and quiz scores.
export const FUNDAMENTALS_MODULES: CourseModule[] = [
  {
    title: 'Module 1 · Foundations',
    lessons: [
      { id: '1-1', title: 'What is Snowflake?', mins: 20 },
      { id: '1-2', title: 'Storage vs compute', mins: 12 },
      { id: '1-3', title: 'Virtual warehouses', mins: 15 },
      { id: '1-4', title: 'Credits and cost', mins: 12 },
      { id: '1-5', title: 'Database, schema, table', mins: 25 },
      { id: '1-6', title: 'The three layers', mins: 25 },
    ],
  },
  {
    title: 'Module 2 · Working with data',
    lessons: [
      { id: '2-1', title: 'Loading data', mins: 30 },
      { id: '2-2', title: 'Time Travel & Fail-safe', mins: 25 },
      { id: '2-3', title: 'Zero-copy cloning', mins: 20 },
      { id: '2-4', title: 'Secure data sharing', mins: 25 },
      { id: '2-5', title: 'Roles and access control', mins: 30 },
      { id: '2-6', title: 'Streams and tasks', mins: 35 },
    ],
  },
  {
    title: 'Module 3 · AI and development',
    lessons: [
      { id: '3-1', title: 'Snowpark', mins: 35 },
      { id: '3-2', title: 'Cortex AI functions', mins: 35 },
      { id: '3-3', title: 'Cortex Code (CoCo)', mins: 40 },
    ],
  },
  {
    title: 'Module 4 · Review',
    lessons: [
      { id: '4-1', title: 'Cheat sheet', mins: 5 },
      { id: '4-2', title: 'Interview Q&A', mins: 30 },
      { id: '4-3', title: 'Final assessment', mins: 25 },
    ],
  },
];

export const FUNDAMENTALS: Course = {
  id: 'fundamentals',
  title: 'Snowflake Fundamentals',
  tagline: 'How Snowflake works, from warehouses and credits to sharing, roles, Snowpark and Cortex.',
  level: 'Beginner',
  lessonPath: id => `/lessons/${id}.html`,
  modules: FUNDAMENTALS_MODULES,
};
