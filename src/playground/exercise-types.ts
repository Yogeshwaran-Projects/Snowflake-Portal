export type Level = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Exercise {
  /** 'pg-01'..'pg-40' — also the Progress key, so it MUST never change once shipped. */
  id: string;
  level: Level;
  topic: string;
  title: string;
  /** Names the exact output columns: "Check my answer" compares values only. */
  task: string;
  hint: string;
  /** Reference SQL, validated against DuckDB before every release. */
  answer: string;
  solutionNote: string;
}

export const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced'];
