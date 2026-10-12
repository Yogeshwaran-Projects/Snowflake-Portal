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

export type Level = 'Easy' | 'Medium' | 'Hard';

/** `level` is OPTIONAL: Snowflake Fundamentals challenges have none; every
 *  SQL-course practice question MUST carry one (Easy → Hard order). */
export interface Challenge { task: string; hint: string; answer: string; level?: Level }

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

// ─────────── simulator (CoCo / Cortex sessions without a Snowflake account) ───────────

/** One turn of a scripted session. For CoCo, `prompt` is what the learner
 *  types into CoCo and `say` + `code` is CoCo's reply. For Cortex, `prompt`
 *  is the SQL/request she runs and `say` explains what Cortex returned. */
export interface SimStep {
  prompt: string;
  say?: string;
  code?: { lang: 'sql' | 'python' | 'yaml' | 'bash' | 'text'; text: string };
  /** Tabular result shown as a grid. */
  output?: { columns: string[]; rows: Cell[][] };
  /** Free-text result (AI answer, CLI output, error message). */
  outputText?: string;
  /** "What to check before you accept this" — the review habit. */
  check?: string[];
}

/** Mounted into `<div data-simulator="<id>"></div>` inside the lesson HTML. */
export interface SimSession {
  id: string;
  title: string;
  tool: 'coco' | 'cortex';
  intro?: string;
  steps: SimStep[];
}

/** The JSON inside each lesson's <script type="application/json" id="lesson-data">. */
export interface LessonData {
  worksheet?: WorksheetConfig;
  quiz?: QuizQuestion[];
  simulators?: SimSession[];
}

// ─────────── courses ───────────

export interface ProjectMilestone {
  /** 'P1'…'P8' */
  id: string;
  title: string;
  /** Lesson whose "Project step" section builds this milestone. Done = that lesson is complete. */
  lessonId: string;
}

export interface CourseProject {
  title: string;
  summary: string;
  milestones: ProjectMilestone[];
}

export interface Course {
  /** URL key: '#<id>/<lessonId>'. Snowflake Fundamentals is 'fundamentals' but ALSO answers to the legacy bare '#1-1' hashes. */
  id: string;
  title: string;
  tagline: string;
  level: string;
  modules: CourseModule[];
  project?: CourseProject;
  /** Path of a lesson fragment, e.g. '/lessons/coco/1-1.html'. Fundamentals keeps '/lessons/1-1.html'. */
  lessonPath: (lessonId: string) => string;
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
