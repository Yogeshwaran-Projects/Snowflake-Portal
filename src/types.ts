// Shared contracts between the lesson pages, the SQL engine and the
// playground. Every module MUST import these instead of redeclaring shapes —
// the lesson JSON in public/lessons/*.html is authored against them.

export type ColumnType = 'NUMBER' | 'VARCHAR' | 'DATE';

/** [name, type, optional note shown in the Schema tab] */
export type ColumnDef = [name: string, type: ColumnType, note?: string];

export type Cell = string | number | null;

export interface TableDef {
  columns: ColumnDef[];
  rows: Cell[][];
}

export type Tables = Record<string, TableDef>;

export interface Example { label: string; sql: string }

export interface Challenge { task: string; hint: string; answer: string }

export interface WorksheetConfig {
  tables: Tables;
  starter: string;
  examples: Example[];
  challenges?: Challenge[];
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

/** The JSON inside each lesson's <script type="application/json" id="lesson-data">. */
export interface LessonData {
  worksheet?: WorksheetConfig;
  quiz?: QuizQuestion[];
}

export interface LessonMeta {
  id: string;
  title: string;
  mins: number;
}

export interface CourseModule {
  title: string;
  lessons: LessonMeta[];
}

/** One result set. Values are plain JS: BigInt → number, DATE → 'YYYY-MM-DD'. */
export interface QueryResult {
  columns: string[];
  rows: Record<string, Cell>[];
  ms: number;
}

export interface SchemaColumn { name: string; type: string }
export interface SchemaTable { name: string; rowCount: number; columns: SchemaColumn[] }
