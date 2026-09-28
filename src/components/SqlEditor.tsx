// CodeMirror 6 SQL editor. Controlled by `value`; Ctrl/Cmd+Enter runs.
//
// Test hook: the root <div data-sql-editor class="sql-editor"> exposes
// `__setSql(text)` which replaces the whole document through a real
// CodeMirror transaction, so `onChange` fires exactly as it does for typing.
// Browser tests rely on it — CodeMirror's contenteditable cannot be driven
// with a plain `.value =`.
import { useEffect, useRef } from 'react';
import { Compartment, EditorState, Prec } from '@codemirror/state';
import { EditorView, drawSelection, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap, completeFromList, completionKeymap } from '@codemirror/autocomplete';
import { PostgreSQL, sql, type SQLNamespace } from '@codemirror/lang-sql';
import type { SchemaTable } from '../types';
import { editorTheme, sqlHighlight } from './sqlEditorTheme';
import '../styles/editor.css';

export interface SqlEditorProps {
  value: string;
  onChange: (sql: string) => void;
  /** Ctrl/Cmd+Enter */
  onRun: () => void;
  /** Drives table/column autocomplete. */
  schema: SchemaTable[];
  minHeight?: number;
  ariaLabel?: string;
}

interface SqlEditorHost extends HTMLDivElement {
  __setSql?: (text: string) => void;
}

function toNamespace(schema: SchemaTable[]): SQLNamespace {
  const ns: Record<string, string[]> = {};
  for (const table of schema) ns[table.name] = table.columns.map(c => c.name);
  return ns;
}

function language(schema: SchemaTable[]) {
  // PostgreSQL is the closest dialect to DuckDB (::casts, ILIKE, $$).
  const support = sql({ dialect: PostgreSQL, schema: toNamespace(schema), upperCaseKeywords: true });
  // lang-sql's schema source only offers columns after `table.` — lesson SQL
  // is written with bare column names, so offer every column at top level too.
  const owners = new Map<string, string[]>();
  for (const table of schema) {
    for (const col of table.columns) owners.set(col.name, [...(owners.get(col.name) ?? []), table.name]);
  }
  const columns = completeFromList([...owners].map(([label, tables]) => ({ label, detail: tables.join(', '), type: 'property' })));
  return [support, PostgreSQL.language.data.of({ autocomplete: columns })];
}

export default function SqlEditor({ value, onChange, onRun, schema, minHeight = 140, ariaLabel }: SqlEditorProps) {
  const hostRef = useRef<SqlEditorHost>(null);
  const viewRef = useRef<EditorView | null>(null);
  // Latest callbacks live in refs so the editor is created once and never
  // re-mounted (which would lose cursor, history and focus) when the parent
  // re-renders with new closures.
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  onChangeRef.current = onChange;
  onRunRef.current = onRun;
  const langCompartment = useRef(new Compartment());
  const labelCompartment = useRef(new Compartment());

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const runKeys = keymap.of([
      { key: 'Mod-Enter', run: () => { onRunRef.current(); return true; } },
      { key: 'Ctrl-Enter', run: () => { onRunRef.current(); return true; } },
    ]);
    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: value,
        extensions: [
          // Prec.highest so Enter-with-modifier reaches us BEFORE defaultKeymap's insertNewline.
          Prec.highest(runKeys),
          lineNumbers(),
          // Phones wrap long SQL instead of scrolling sideways inside a
          // 390px-wide editor, matching how lesson code blocks behave there.
          ...(window.matchMedia('(max-width: 600px)').matches ? [EditorView.lineWrapping] : []),
          highlightActiveLineGutter(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          autocompletion(),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...completionKeymap, indentWithTab]),
          langCompartment.current.of(language(schema)),
          labelCompartment.current.of(EditorView.contentAttributes.of({ 'aria-label': ariaLabel ?? 'SQL editor' })),
          editorTheme,
          syntaxHighlighting(sqlHighlight),
          EditorView.updateListener.of(update => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;
    const setSql = (text: string): void => {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
    };
    Object.assign(host, { __setSql: setSql });
    return () => {
      delete host.__setSql;
      view.destroy();
      viewRef.current = null;
    };
    // Mount once: value/schema/ariaLabel changes are synced by the effects below.
  }, []);

  // External value changes (example buttons, reset) replace the document.
  // Typing round-trips value === doc, so this is a no-op and the cursor stays.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
  }, [value]);

  useEffect(() => {
    viewRef.current?.dispatch({ effects: langCompartment.current.reconfigure(language(schema)) });
  }, [schema]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: labelCompartment.current.reconfigure(EditorView.contentAttributes.of({ 'aria-label': ariaLabel ?? 'SQL editor' })),
    });
  }, [ariaLabel]);

  useEffect(() => {
    const dom = viewRef.current?.dom;
    if (dom) dom.style.minHeight = `${minHeight}px`;
  }, [minHeight]);

  return <div ref={hostRef} className="sql-editor" data-sql-editor="" />;
}
