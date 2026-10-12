import type { Course } from '../types';

// CoCo Masterclass. Every lesson from 1-2 on carries a "Project step" that
// builds the Bank Churn Predictor WITH CoCo, so the project grows side by side
// with the lessons. Milestone → lesson mapping lives here and nowhere else.
export const COCO: Course = {
  id: 'coco',
  title: 'CoCo Masterclass',
  tagline: 'From "what is CoCo" to building a full data-science project with it.',
  level: 'Beginner → Advanced',
  lessonPath: id => `/lessons/coco/${id}.html`,
  modules: [
    {
      title: 'Module 1 · Meet CoCo',
      lessons: [
        { id: '1-1', title: 'What is CoCo?', mins: 20 },
        { id: '1-2', title: 'Where CoCo runs and setup', mins: 30 },
        { id: '1-3', title: 'How CoCo works', mins: 25 },
        { id: '1-4', title: 'Prompting craft', mins: 25 },
      ],
    },
    {
      title: 'Module 2 · CoCo for SQL and data',
      lessons: [
        { id: '2-1', title: 'Explore a new schema', mins: 30 },
        { id: '2-2', title: 'Write, explain and fix SQL', mins: 30 },
        { id: '2-3', title: 'Data quality and cleaning', mins: 35 },
        { id: '2-4', title: 'Optimise queries and cost', mins: 30 },
        { id: '2-5', title: 'Document your data', mins: 20 },
      ],
    },
    {
      title: 'Module 3 · CoCo for data science',
      lessons: [
        { id: '3-1', title: 'Notebooks and Snowpark Python', mins: 35 },
        { id: '3-2', title: 'Feature engineering', mins: 35 },
        { id: '3-3', title: 'Train a model with Snowpark ML', mins: 40 },
        { id: '3-4', title: 'Model Registry and scoring', mins: 35 },
        { id: '3-5', title: 'Streamlit apps', mins: 35 },
      ],
    },
    {
      title: 'Module 4 · Masterclass',
      lessons: [
        { id: '4-1', title: 'Pipelines: dynamic tables, tasks, dbt', mins: 35 },
        { id: '4-2', title: 'CLI power workflows', mins: 30 },
        { id: '4-3', title: 'Governance and safety on bank data', mins: 30 },
        { id: '4-4', title: 'Cost control and team workflow', mins: 25 },
        { id: '4-5', title: 'Capstone review and interview Q&A', mins: 40 },
      ],
    },
  ],
  project: {
    title: 'Bank Churn Predictor',
    summary: 'Load bank data, explore and clean it, engineer features, train and register a churn model, score customers and ship a Streamlit dashboard, all built with CoCo.',
    milestones: [
      { id: 'P1', title: 'Create the project database and load data', lessonId: '1-2' },
      { id: 'P2', title: 'Explore the data with CoCo', lessonId: '2-1' },
      { id: 'P3', title: 'Clean and quality-check', lessonId: '2-3' },
      { id: 'P4', title: 'Engineer features', lessonId: '3-2' },
      { id: 'P5', title: 'Train the churn model', lessonId: '3-3' },
      { id: 'P6', title: 'Register and score', lessonId: '3-4' },
      { id: 'P7', title: 'Build the Streamlit dashboard', lessonId: '3-5' },
      { id: 'P8', title: 'Schedule the pipeline and review', lessonId: '4-1' },
    ],
  },
};
