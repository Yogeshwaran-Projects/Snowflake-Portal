// In-browser SQL worksheet backed by AlaSQL, so a learner can practise
// without a Snowflake account. Each lesson gets its OWN database, built from
// the lesson's JSON, so one lesson's edits never leak into another.
//
// NOTE: AlaSQL is standard SQL, not Snowflake. Snowflake-only features
// (Time Travel, CLONE, Cortex) are practised in the lesson's real lab instead.
window.Worksheet = (() => {
  const TYPE = { NUMBER: 'NUMBER', VARCHAR: 'STRING', DATE: 'STRING' };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = v => typeof v === 'number' ? v.toLocaleString('en-IN') : v;

  function buildDb(tables) {
    const db = new alasql.Database();
    for (const [name, t] of Object.entries(tables)) {
      db.exec(`CREATE TABLE ${name} (${t.columns.map(([c, ty]) => `${c} ${TYPE[ty] || 'STRING'}`).join(', ')})`);
      db.tables[name].data = t.rows.map(r => Object.fromEntries(t.columns.map(([c], i) => [c, r[i]])));
    }
    return db;
  }

  // Challenge answers are compared by VALUES only, ignoring column names and
  // row order — a learner who writes `AS total` instead of `AS total_deposit`
  // is still right.
  function sameResult(a, b) {
    const norm = rows => (Array.isArray(rows) ? rows : []).map(r => JSON.stringify(Object.values(r).map(v => typeof v === 'number' ? Math.round(v * 100) / 100 : v))).sort();
    const x = norm(a), y = norm(b);
    return x.length === y.length && x.every((v, i) => v === y[i]);
  }

  function renderTable(out) {
    const cols = Object.keys(out[0]);
    const num = c => typeof out[0][c] === 'number';
    return '<table><thead><tr>' + cols.map(c => `<th class="${num(c) ? 'num' : ''}">${esc(c)}</th>`).join('') + '</tr></thead><tbody>' +
      out.map(r => '<tr>' + cols.map(c => `<td class="${num(c) ? 'num' : ''}">${esc(fmt(r[c]))}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
  }

  function schemaText(tables) {
    return Object.entries(tables).map(([name, t]) => {
      const w = Math.max(...t.columns.map(([c]) => c.length));
      return `<span class="t">${esc(name)}</span> <span class="ty">· ${t.rows.length} rows</span>\n` +
        t.columns.map(([c, ty, note]) => `  ${esc(c.padEnd(w))}  <span class="ty">${esc(ty)}${note ? '   -- ' + esc(note) : ''}</span>`).join('\n');
    }).join('\n\n');
  }

  function mount(root, cfg) {
    const db = buildDb(cfg.tables);
    const $ = s => root.querySelector(s);
    root.innerHTML = `
      <div class="ws">
        <div class="ws-bar">
          <button class="ws-tab on" data-tab="editor" type="button">Worksheet</button>
          <button class="ws-tab" data-tab="schema" type="button">Schema</button>
          <button class="btn" data-run type="button"><svg class="ico" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l11-7z"/></svg>Run</button>
        </div>
        <textarea class="sql" spellcheck="false" aria-label="SQL editor"></textarea>
        <div class="schema" hidden>${schemaText(cfg.tables)}</div>
      </div>
      <div class="examples">Examples: ${cfg.examples.map((e, i) => `<button type="button" data-ex="${i}">${esc(e.label)}</button>`).join('')}</div>
      <div class="results">
        <div class="results-bar"><span data-status>Results</span><span data-time></span></div>
        <div class="grid-wrap" data-out><div class="empty">Select Run to see results. Tip: Ctrl + Enter also runs the query.</div></div>
      </div>
      ${cfg.challenges?.length ? `<div class="panel"><div class="panel-head"><h3>Challenges</h3><span class="overline">Write the SQL above, then check</span></div>
        ${cfg.challenges.map((c, i) => `<div class="challenge"><div><p><b>${i + 1}.</b> ${esc(c.task)}</p><p class="hint">Hint: ${esc(c.hint)}</p></div>
          <button class="btn btn-secondary" type="button" data-check="${i}">Check my answer</button><div class="verdict" hidden></div></div>`).join('')}</div>` : ''}`;

    const box = $('textarea'), schema = $('.schema'), out = $('[data-out]'), status = $('[data-status]'), time = $('[data-time]');
    box.value = cfg.starter;

    const showTab = tab => {
      root.querySelectorAll('.ws-tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
      schema.hidden = tab !== 'schema'; box.hidden = tab === 'schema';
    };

    function exec(sql) {
      const t0 = performance.now();
      const res = db.exec(sql);
      return { res, ms: Math.max(1, Math.round(performance.now() - t0)) };
    }

    function run() {
      showTab('editor');
      try {
        const { res, ms } = exec(box.value);
        time.textContent = `${ms} ms`;
        if (!Array.isArray(res) || !res.length) {
          status.innerHTML = '<span class="dot ok">Query ran</span>';
          out.innerHTML = '<div class="empty">No rows matched. Try a different filter.</div>';
          return;
        }
        status.innerHTML = `<span class="dot ok">${res.length} row${res.length > 1 ? 's' : ''}</span>`;
        out.innerHTML = renderTable(res);
      } catch (e) {
        time.textContent = '';
        status.innerHTML = '<span class="dot bad">Query failed</span>';
        out.innerHTML = `<div class="empty bad">${esc(e.message)}. Check the spelling of table and column names, and that text values are in 'single quotes'.</div>`;
      }
    }

    root.querySelectorAll('.ws-tab').forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));
    $('[data-run]').addEventListener('click', run);
    box.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); } });
    root.querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => { box.value = cfg.examples[b.dataset.ex].sql; run(); }));
    root.querySelectorAll('[data-check]').forEach(b => b.addEventListener('click', () => {
      const c = cfg.challenges[b.dataset.check], verdict = b.parentElement.querySelector('.verdict');
      verdict.hidden = false;
      let mine;
      try { mine = exec(box.value).res; } catch (e) {
        verdict.className = 'verdict bad'; verdict.textContent = 'Your SQL has an error. Run it first and fix the message shown in the results.'; return;
      }
      const ok = sameResult(mine, exec(c.answer).res);
      verdict.className = `verdict ${ok ? 'ok' : 'bad'}`;
      verdict.textContent = ok ? 'Correct. Your query returns exactly the right answer.' : 'Not yet. Your query runs, but the answer is different. Re-read the task and the hint.';
      run();
    }));
  }

  return { mount };
})();
