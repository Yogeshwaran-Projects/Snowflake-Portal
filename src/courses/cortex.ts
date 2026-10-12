import type { Course } from '../types';

// Cortex Masterclass. The Complaint Intelligence project is built step by
// step inside the lessons listed in `project.milestones`.
export const CORTEX: Course = {
  id: 'cortex',
  title: 'Cortex Masterclass',
  tagline: 'Snowflake’s AI layer: LLM functions, search, Analyst, agents and ML, with a full GenAI project.',
  level: 'Beginner → Advanced',
  lessonPath: id => `/lessons/cortex/${id}.html`,
  modules: [
    {
      title: 'Module 1 · Foundations',
      lessons: [
        { id: '1-1', title: 'What is Cortex? (and CoCo vs Cortex)', mins: 30 },
        { id: '1-2', title: 'LLM basics: tokens, models, cost', mins: 25 },
        { id: '1-3', title: 'Setup and your first AI query', mins: 30 },
      ],
    },
    {
      title: 'Module 2 · AI SQL functions',
      lessons: [
        { id: '2-1', title: 'AI_COMPLETE and prompt engineering', mins: 35 },
        { id: '2-2', title: 'Classify, filter and sentiment', mins: 30 },
        { id: '2-3', title: 'Extract, summarise and translate', mins: 35 },
        { id: '2-4', title: 'Documents with AI_PARSE_DOCUMENT', mins: 30 },
        { id: '2-5', title: 'Embeddings and similarity', mins: 30 },
      ],
    },
    {
      title: 'Module 3 · Cortex services',
      lessons: [
        { id: '3-1', title: 'Cortex Search and RAG', mins: 40 },
        { id: '3-2', title: 'Cortex Analyst and semantic views', mins: 40 },
        { id: '3-3', title: 'Cortex Agents', mins: 35 },
        { id: '3-4', title: 'Snowflake CoWork', mins: 20 },
      ],
    },
    {
      title: 'Module 4 · ML and masterclass',
      lessons: [
        { id: '4-1', title: 'ML functions: forecast, anomaly, classify', mins: 35 },
        { id: '4-2', title: 'Evaluation and fine-tuning', mins: 30 },
        { id: '4-3', title: 'Governance, guardrails and cost', mins: 30 },
        { id: '4-4', title: 'Ship it: Streamlit app and review', mins: 35 },
        { id: '4-5', title: 'Capstone review and interview Q&A', mins: 40 },
      ],
    },
  ],
  project: {
    title: 'Complaint Intelligence',
    summary: 'Turn raw customer complaints into insight: classify, score sentiment, extract fields, summarise, search with RAG, ask questions in plain English and combine it all in an agent and a Streamlit app.',
    milestones: [
      { id: 'P1', title: 'Load the complaints', lessonId: '1-3' },
      { id: 'P2', title: 'Classify and score sentiment', lessonId: '2-2' },
      { id: 'P3', title: 'Extract fields and summarise', lessonId: '2-3' },
      { id: 'P4', title: 'Find similar complaints', lessonId: '2-5' },
      { id: 'P5', title: 'Build a RAG chatbot with Cortex Search', lessonId: '3-1' },
      { id: 'P6', title: 'Ask in plain English with Cortex Analyst', lessonId: '3-2' },
      { id: 'P7', title: 'Combine both in a Cortex Agent', lessonId: '3-3' },
      { id: 'P8', title: 'Ship the Streamlit app and review cost', lessonId: '4-4' },
    ],
  },
};
