// DOM wiring for the lesson fragment that React injects verbatim through
// dangerouslySetInnerHTML. React never reconciles inside that subtree, so
// every helper here attaches plain listeners and returns an undo function.
// LessonView runs the undo on lesson change AND on StrictMode's rehearsal
// unmount — a helper that could not undo itself would double-fire after it.
//
// Design rules:
//   1. No React, no Progress import: helpers take callbacks so they stay
//      testable with a bare DOM and never hide app state.
//   2. Idempotent where no undo is possible (data-label) so a rehearsal run
//      leaves the same DOM as a single run.

export type Cleanup = () => void;

export interface Section {
  id: string;
  label: string;
}

function listen<K extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  type: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
): Cleanup {
  el.addEventListener(type, handler);
  return () => el.removeEventListener(type, handler);
}

function joinCleanups(list: Cleanup[]): Cleanup {
  return () => list.forEach(fn => fn());
}

// ─────────── sections / navigation ───────────

/** data-toc is the short rail label; the h2 is the fallback for sections without one. */
export function collectSections(root: ParentNode): Section[] {
  return [...root.querySelectorAll<HTMLElement>('section.sec[id]')].map(s => ({
    id: s.id,
    label: s.dataset.toc || s.querySelector('h2')?.textContent?.trim() || s.id,
  }));
}

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// The "On this page" rail is hidden below 1180px (app.css); this select
// replaces it there. Only worth showing once a lesson has more than two
// sections, matching the old shell.
export function insertJump(root: ParentNode, sections: Section[]): Cleanup {
  const head = root.querySelector<HTMLElement>('.lesson-head');
  if (!head || sections.length <= 2) return () => {};

  const wrap = document.createElement('div');
  wrap.className = 'jump';
  const label = document.createElement('label');
  label.htmlFor = 'jump';
  label.textContent = 'Jump to';
  const select = document.createElement('select');
  select.id = 'jump';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = 'Choose a section…';
  select.append(blank);
  for (const s of sections) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.label;
    select.append(opt);
  }
  wrap.append(label, select);
  head.insertAdjacentElement('afterend', wrap);

  // Reset to the placeholder after jumping so the same section can be chosen
  // twice in a row — a <select> does not fire change for an unchanged value.
  const off = listen(select, 'change', () => {
    if (select.value) scrollToSection(select.value);
    select.value = '';
  });
  return () => { off(); wrap.remove(); };
}

// ─────────── copy buttons ───────────

export function wireCopyButtons(root: ParentNode): Cleanup {
  const timers: number[] = [];
  const offs = [...root.querySelectorAll<HTMLElement>('.copy')].map(btn => listen(btn, 'click', () => {
    const pre = btn.nextElementSibling;
    if (!(pre instanceof HTMLElement)) return;
    const text = pre.innerText;
    const clip = navigator.clipboard;
    const write = clip ? clip.writeText(text) : Promise.reject(new Error('clipboard unavailable'));
    write.then(() => {
      btn.textContent = 'Copied';
      timers.push(window.setTimeout(() => { btn.textContent = 'Copy'; }, 1500));
    }).catch(() => {
      // Insecure context or denied permission: select the block so the
      // learner can copy with the keyboard instead of getting nothing.
      const range = document.createRange();
      range.selectNodeContents(pre);
      const sel = getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  }));
  return () => { joinCleanups(offs)(); timers.forEach(t => clearTimeout(t)); };
}

// ─────────── lab steps ───────────

export function wireLabSteps(root: ParentNode): Cleanup {
  const offs = [...root.querySelectorAll<HTMLInputElement>('.steps input[type=checkbox]')].map(cb =>
    listen(cb, 'change', () => cb.closest('li')?.classList.toggle('checked', cb.checked)));
  return joinCleanups(offs);
}

// ─────────── tables ───────────

// Phones show tables as stacked cards; each cell carries its column name so
// the card still says what the value means once the header row is hidden.
export function labelTableCells(root: ParentNode) {
  for (const table of root.querySelectorAll<HTMLTableElement>('.table-wrap table')) {
    const heads = [...table.querySelectorAll('thead th')].map(th => th.textContent?.trim() ?? '');
    for (const tr of table.querySelectorAll('tbody tr')) {
      [...tr.children].forEach((td, i) => {
        const head = heads[i];
        if (head && td instanceof HTMLElement) td.dataset.label = head;
      });
    }
  }
}

// ─────────── mark complete ───────────

export function wireCompleteButton(root: ParentNode, isDone: () => boolean, markDone: () => void): Cleanup {
  const btn = root.querySelector<HTMLButtonElement>('[data-complete]');
  if (!btn) return () => {};
  const paint = () => {
    if (!isDone()) return;
    btn.textContent = 'Completed';
    btn.disabled = true;
  };
  paint();
  return listen(btn, 'click', () => { markDone(); paint(); });
}
