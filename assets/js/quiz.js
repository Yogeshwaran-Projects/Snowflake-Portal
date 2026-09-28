// Knowledge check: one attempt per question, instant feedback with the
// reason, best score saved to Progress. "Try again" resets the questions.
window.Quiz = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function mount(root, lessonId, questions, onScore) {
    const best = window.Progress.bestScore(lessonId);
    root.innerHTML = `
      <div class="panel-head"><h3>${questions.length} questions</h3>
        <span class="score">Score <b data-score>0 / ${questions.length}</b>${best ? ` · Best ${best.score} / ${best.total}` : ''}</span></div>
      <div data-qs></div>
      <button class="btn btn-secondary retry" type="button" data-retry hidden>Try again</button>`;

    const qs = root.querySelector('[data-qs]'), scoreEl = root.querySelector('[data-score]'), retry = root.querySelector('[data-retry]');
    let score = 0, answered = 0;

    questions.forEach((item, i) => {
      const box = document.createElement('div');
      box.className = 'q';
      box.innerHTML = `<p>${i + 1}. ${esc(item.q)}</p>${item.options.map((t, j) => `<button class="opt" type="button" data-j="${j}">${esc(t)}</button>`).join('')}<div class="feedback" hidden></div>`;
      box.querySelectorAll('.opt').forEach(btn => btn.addEventListener('click', () => {
        const ok = +btn.dataset.j === item.answer;
        box.querySelectorAll('.opt').forEach(b => { b.disabled = true; if (+b.dataset.j === item.answer) b.classList.add('right'); });
        if (ok) score++; else btn.classList.add('wrong');
        answered++;
        const fb = box.querySelector('.feedback');
        fb.hidden = false;
        fb.innerHTML = `<b>${ok ? 'Correct.' : 'Incorrect.'}</b> ${esc(item.why)}`;
        scoreEl.textContent = `${score} / ${questions.length}`;
        if (answered === questions.length) {
          window.Progress.saveScore(lessonId, score, questions.length);
          retry.hidden = false;
          onScore?.(score, questions.length);
        }
      }));
      qs.appendChild(box);
    });

    retry.addEventListener('click', () => mount(root, lessonId, questions, onScore));
  }

  return { mount };
})();
