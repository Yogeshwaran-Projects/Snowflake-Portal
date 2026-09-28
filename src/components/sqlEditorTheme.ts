// Editor look: the worksheet is a dark code panel in BOTH site themes (see
// --code-bg in theme.css, dark in light mode too), so every colour here is a
// --code-* token. Strings and numbers have no token in the palette; those two
// literals are tuned for the dark panel and are the only literal colours in
// the editor.
import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export const editorTheme = EditorView.theme({
  '&': { backgroundColor: 'var(--code-bg)', color: 'var(--code-ink)', fontSize: '13.5px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.6' },
  '.cm-content': { padding: '12px 0', caretColor: 'var(--code-ink)' },
  '.cm-line': { padding: '0 16px 0 6px' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--code-ink)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--code-line)',
  },
  '.cm-gutters': { backgroundColor: 'var(--code-bg)', color: 'var(--code-dim)', border: 'none', paddingLeft: '8px' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--code-ink)' },
  '&.cm-focused .cm-matchingBracket': { backgroundColor: 'transparent', outline: '1px solid var(--code-dim)' },
  '&.cm-focused .cm-nonmatchingBracket': { backgroundColor: 'transparent', outline: '1px solid var(--bad)' },
  '.cm-tooltip': { backgroundColor: 'var(--code-bg)', border: '1px solid var(--code-line)', color: 'var(--code-ink)' },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--mono)', fontSize: '13px' },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'var(--code-line)', color: 'var(--code-ink)' },
  '.cm-completionMatchedText': { textDecoration: 'none', color: 'var(--code-kw)', fontWeight: '600' },
  '.cm-completionIcon': { color: 'var(--code-dim)' },
}, { dark: true });

export const sqlHighlight = HighlightStyle.define([
  { tag: t.keyword, color: 'var(--code-kw)', fontWeight: '600' },
  { tag: [t.typeName, t.bool, t.null, t.standard(t.name)], color: 'var(--code-kw)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--code-dim)', fontStyle: 'italic' },
  { tag: t.string, color: '#9AE6B4' },
  { tag: t.number, color: '#F6D365' },
  { tag: [t.operator, t.punctuation], color: 'var(--code-dim)' },
  { tag: [t.name, t.special(t.string)], color: 'var(--code-ink)' },
]);
