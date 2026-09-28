// Statement splitter. run() executes statements one at a time so the LAST
// result is the one returned and an error names the statement that failed;
// duckdb-wasm's query() only returns the first result of a multi-statement
// string, which would show learners a stale result for
// `CREATE TABLE …; SELECT …`.
//
// Handles: 'single' (with '' escapes), "double" identifiers, -- line and
// /* block */ comments. A chunk that holds only comments/whitespace is dropped
// — sending it to DuckDB would fail with "no statement to execute".
// Known limitation: $$dollar-quoted$$ strings are not recognised; a `;` inside
// one splits the statement. Lesson SQL never uses them.
export function splitStatements(sql: string): string[] {
  const out: string[] = [];
  const n = sql.length;
  let start = 0;
  let hasCode = false;
  let i = 0;

  const flush = (end: number): void => {
    const text = sql.slice(start, end).trim();
    if (hasCode && text) out.push(text);
    start = end + 1;
    hasCode = false;
  };

  while (i < n) {
    const c = sql.charAt(i);
    const d = sql.charAt(i + 1);
    if (c === '-' && d === '-') {
      const eol = sql.indexOf('\n', i);
      i = eol < 0 ? n : eol + 1;
      continue;
    }
    if (c === '/' && d === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end < 0 ? n : end + 2;
      continue;
    }
    if (c === "'" || c === '"') {
      hasCode = true;
      let j = i + 1;
      while (j < n) {
        if (sql.charAt(j) === c) {
          if (sql.charAt(j + 1) === c) { j += 2; continue; } // doubled quote = escaped
          break;
        }
        j++;
      }
      i = j + 1;
      continue;
    }
    if (c === ';') {
      flush(i);
      i++;
      continue;
    }
    if (!/\s/.test(c)) hasCode = true;
    i++;
  }
  flush(n);
  return out;
}
