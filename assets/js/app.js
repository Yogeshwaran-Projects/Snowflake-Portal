// Course shell: draws the outline and progress, loads the lesson named in the
// URL hash (#1-1) from /lessons/<id>.html, then wires its worksheet, quiz,
// lab checkboxes, copy buttons and "on this page" links.
(() => {
  const { COURSE, Progress, Worksheet, Quiz } = window;
  const outline = document.getElementById('outline');
  const lessonEl = document.getElementById('lesson');
  const toc = document.getElementById('toc');
  const menuBtn = document.getElementById('menuBtn');
  const scrim = document.getElementById('scrim');
  const check = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="m5 12 5 5L20 7"/></svg>';
  const firstReady = COURSE.allLessons.find(l => l.ready).id;

  const currentId = () => {
    const id = location.hash.slice(1);
    return COURSE.allLessons.some(l => l.id === id && l.ready) ? id : firstReady;
  };

  function renderShell() {
    const cur = currentId();
    outline.innerHTML = COURSE.modules.map(m => {
      const done = m.lessons.filter(l => Progress.isDone(l.id)).length;
      return `<div class="mod"><div class="mod-head"><b>${m.title}</b><span>${done}/${m.lessons.length}</span></div>` +
        m.lessons.map(l => {
          const cls = ['lesson-link', l.id === cur && 'current', Progress.isDone(l.id) && 'done', !l.ready && 'soon'].filter(Boolean).join(' ');
          const inner = `<span class="st">${Progress.isDone(l.id) ? check : ''}</span>${l.id.replace('-', '.')} ${l.title}<span class="dur">${l.mins}m</span>`;
          return l.ready ? `<a class="${cls}" href="#${l.id}">${inner}</a>` : `<span class="${cls}" aria-disabled="true" title="Coming soon">${inner}</span>`;
        }).join('') + '</div>';
    }).join('');
    const total = COURSE.allLessons.length, done = Progress.doneCount();
    document.getElementById('barFill').style.width = `${(done / total) * 100}%`;
    document.getElementById('progText').textContent = `${done} of ${total} complete`;
  }

  async function loadLesson() {
    const id = currentId();
    const meta = COURSE.allLessons.find(l => l.id === id);
    document.title = `${meta.title} · Sky Library`;
    renderShell();
    setMenu(false);

    let res;
    try { res = await fetch(`/lessons/${id}.html`, { cache: 'no-store' }); } catch (e) { res = null; }
    // A session that expired while the page was open is redirected to the
    // login page by the middleware — send the learner there, not a blank lesson.
    if (res && res.redirected && new URL(res.url).pathname.startsWith('/login')) { location.href = '/login'; return; }
    if (!res || !res.ok) { lessonEl.innerHTML = '<p class="loading">This lesson could not load. Check your connection and refresh the page.</p>'; return; }

    lessonEl.innerHTML = await res.text();
    const data = JSON.parse(lessonEl.querySelector('#lesson-data').textContent);
    wireLesson(id, data);
    window.scrollTo(0, 0);
  }

  function wireLesson(id, data) {
    const ws = lessonEl.querySelector('[data-worksheet]');
    if (ws && data.worksheet) Worksheet.mount(ws, data.worksheet);
    const quiz = lessonEl.querySelector('[data-quiz]');
    if (quiz && data.quiz) Quiz.mount(quiz, id, data.quiz);

    lessonEl.querySelectorAll('.steps input[type=checkbox]').forEach(cb =>
      cb.addEventListener('change', () => cb.closest('li').classList.toggle('checked', cb.checked)));

    lessonEl.querySelectorAll('.copy').forEach(b => b.addEventListener('click', () => {
      const pre = b.nextElementSibling;
      navigator.clipboard.writeText(pre.innerText).then(() => {
        b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy'; }, 1500);
      }).catch(() => {
        const r = document.createRange(); r.selectNodeContents(pre);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      });
    }));

    const completeBtn = lessonEl.querySelector('[data-complete]');
    const paintComplete = () => { if (Progress.isDone(id)) { completeBtn.textContent = 'Completed'; completeBtn.disabled = true; } };
    completeBtn?.addEventListener('click', () => { Progress.markDone(id); paintComplete(); renderShell(); });
    if (completeBtn) paintComplete();

    // Phones show tables as stacked cards; each cell carries its column name
    // so the card still says what the value means once the header row is hidden.
    lessonEl.querySelectorAll('.table-wrap table').forEach(t => {
      const heads = [...t.querySelectorAll('thead th')].map(th => th.textContent.trim());
      t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => { if (heads[i]) td.dataset.label = heads[i]; }));
    });

    const sections = [...lessonEl.querySelectorAll('section.sec[id]')];
    // The "On this page" rail is hidden below 1180px; this jumper replaces it there.
    const head = lessonEl.querySelector('.lesson-head');
    if (head && sections.length > 2) {
      head.insertAdjacentHTML('afterend', `<div class="jump"><label for="jump">Jump to</label><select id="jump"><option value="">Choose a section…</option>${
        sections.map(s => `<option value="${s.id}">${s.dataset.toc || s.querySelector('h2').textContent}</option>`).join('')}</select></div>`);
      const sel = lessonEl.querySelector('#jump');
      sel.addEventListener('change', () => { if (sel.value) document.getElementById(sel.value).scrollIntoView({ behavior: 'smooth', block: 'start' }); sel.value = ''; });
    }
    toc.innerHTML = '<span class="overline">On this page</span>' +
      sections.map(s => `<button type="button" data-to="${s.id}">${s.dataset.toc || s.querySelector('h2').textContent}</button>`).join('');
    toc.querySelectorAll('[data-to]').forEach(b => b.addEventListener('click', () =>
      document.getElementById(b.dataset.to).scrollIntoView({ behavior: 'smooth', block: 'start' })));
  }

  function setMenu(open) {
    outline.classList.toggle('open', open);
    scrim.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', () => setMenu(!outline.classList.contains('open')));
  scrim.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('hashchange', loadLesson);
  loadLesson();
})();
