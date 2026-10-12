import type { Course } from '../types';

// SQL Beginner → Advanced. Every lesson's worksheet holds 5–6 graded practice
// questions (Easy → Hard) instead of the Fundamentals' 3 challenges.
export const SQL: Course = {
  id: 'sql',
  title: 'SQL: Beginner to Advanced',
  tagline: 'Every SQL topic from SELECT to window functions and MERGE, with 5–6 graded questions per topic.',
  level: 'Beginner → Advanced',
  lessonPath: id => `/lessons/sql/${id}.html`,
  modules: [
    {
      title: 'Module 1 · Beginner',
      lessons: [
        { id: '1-1', title: 'SELECT and FROM', mins: 20 },
        { id: '1-2', title: 'Filtering with WHERE', mins: 25 },
        { id: '1-3', title: 'Sorting and LIMIT', mins: 20 },
        { id: '1-4', title: 'Text, number and date functions', mins: 30 },
        { id: '1-5', title: 'NULL and CASE', mins: 25 },
        { id: '1-6', title: 'Aggregates', mins: 25 },
        { id: '1-7', title: 'GROUP BY and HAVING', mins: 30 },
      ],
    },
    {
      title: 'Module 2 · Intermediate',
      lessons: [
        { id: '2-1', title: 'Inner joins', mins: 30 },
        { id: '2-2', title: 'Outer joins and anti-joins', mins: 30 },
        { id: '2-3', title: 'Self and cross joins', mins: 25 },
        { id: '2-4', title: 'Subqueries', mins: 30 },
        { id: '2-5', title: 'CTEs (WITH)', mins: 30 },
        { id: '2-6', title: 'UNION, INTERSECT, EXCEPT', mins: 25 },
        { id: '2-7', title: 'Dates in depth', mins: 30 },
      ],
    },
    {
      title: 'Module 3 · Advanced',
      lessons: [
        { id: '3-1', title: 'Ranking windows', mins: 30 },
        { id: '3-2', title: 'LAG, LEAD, running totals and frames', mins: 35 },
        { id: '3-3', title: 'QUALIFY and de-duplication', mins: 25 },
        { id: '3-4', title: 'Recursive CTEs, gaps and islands', mins: 35 },
        { id: '3-5', title: 'JSON and semi-structured data', mins: 30 },
        { id: '3-6', title: 'Changing data: INSERT, UPDATE, DELETE, MERGE', mins: 30 },
        { id: '3-7', title: 'Performance on Snowflake', mins: 30 },
        { id: '3-8', title: 'SQL for data science', mins: 35 },
      ],
    },
  ],
};
