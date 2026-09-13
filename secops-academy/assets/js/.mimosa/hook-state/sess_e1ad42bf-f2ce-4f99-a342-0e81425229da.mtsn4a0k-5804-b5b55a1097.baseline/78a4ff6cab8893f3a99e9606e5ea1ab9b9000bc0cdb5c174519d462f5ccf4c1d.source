/* quiz.js — 题库练习：分类筛选 / 即时判定 / 错题本 */
(function () {
  const $ = s => document.querySelector(s);
  let cat = '全部', order = [], idx = 0, answered = false, session = { total: 0, right: 0 };

  const cats = ['全部', '错题本', ...[...new Set(QUIZ.map(q => q.cat))]];

  function pool() {
    if (cat === '全部') return QUIZ;
    if (cat === '错题本') return QUIZ.filter(q => Progress.data.quiz.wrong.includes(q.id));
    return QUIZ.filter(q => q.cat === cat);
  }

  function shuffle() {
    order = pool().map((_, i) => i).sort(() => Math.random() - .5);
    idx = 0; session = { total: 0, right: 0 };
    renderCatRow();
    renderQ();
  }

  function renderCatRow() {
    $('#catRow').innerHTML = cats.map(c =>
      `<button class="chip ${c === cat ? 'on' : ''}" data-c="${c}">${c}${c === '错题本' ? ` (${Progress.data.quiz.wrong.length})` : ''}</button>`).join('')
      + `<span style="flex:1"></span><span style="font-size:12.5px;color:var(--tx3);font-family:var(--m)">本局 ${session.right}/${session.total} · 历史正确率 ${Progress.data.quiz.total ? Math.round(Progress.data.quiz.correct / Progress.data.quiz.total * 100) : '--'}%</span>`;
    document.querySelectorAll('#catRow .chip').forEach(b => {
      b.onclick = () => { cat = b.dataset.c; shuffle(); };
    });
  }

  function renderQ() {
    const list = pool();
    const box = $('#quizCard');
    if (!list.length) {
      box.innerHTML = `<div class="empty-state"><span class="e-ico">🎉</span>${cat === '错题本' ? '错题本空空如也——要么你还没错过，要么你已经全消灭了！' : '该分类暂无题目'}</div>`;
      renderCatRow(); return;
    }
    if (idx >= order.length) {
      box.innerHTML = `
        <div class="game-over">
          <div class="go-ico">${session.right === order.length && order.length > 0 ? '🏆' : '📊'}</div>
          <h3>本组练习完成</h3>
          <p>答对 ${session.right} / ${order.length} 道。${session.right === order.length ? '全对！这就是肌肉记忆的力量。' : '错题已自动收进错题本，消灭它们！'}</p>
          <button class="btn btn-primary" id="qAgain">🔄 再来一组</button>
        </div>`;
      $('#qAgain').onclick = shuffle;
      renderCatRow(); return;
    }

    const q = list[order[idx]];
    answered = false;
    const lvTxt = ['入门', '进阶', '挑战'][q.lv - 1];
    box.innerHTML = `
      <div class="q-meta">
        <span class="tag cy">${q.cat}</span>
        <span class="tag ${q.lv === 1 ? 'li' : q.lv === 2 ? 'am' : 'ro'}">${lvTxt}</span>
        <span style="flex:1"></span>
        <span style="font-family:var(--m);font-size:12px;color:var(--tx3)">${idx + 1} / ${order.length}</span>
      </div>
      <div class="q-text">${q.q}</div>
      <div id="qOpts">${q.opts.map((o, i) =>
        `<button class="opt" data-i="${i}"><span class="o-key">${'ABCD'[i]}</span><span>${o}</span></button>`).join('')}</div>
      <div class="explain-box" id="qEx"></div>
      <div style="margin-top:16px;display:flex;gap:12px">
        <button class="btn btn-primary" id="qNext" style="flex:1" disabled>下一题 →</button>
      </div>`;

    box.querySelectorAll('.opt').forEach(btn => {
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        const i = +btn.dataset.i;
        const ok = i === q.a;
        session.total++; if (ok) session.right++;
        Progress.recordQuiz(q.id, ok);
        box.querySelectorAll('.opt').forEach((b, j) => {
          b.disabled = true;
          if (j === q.a) b.classList.add('right');
          else if (j === i) b.classList.add('wrong');
        });
        const ex = $('#qEx');
        ex.innerHTML = `<b>${ok ? '✅ 答对了！' : '❌ 正确答案：' + 'ABCD'[q.a] + ' · ' + q.opts[q.a]}</b><br>💡 ${q.ex}`;
        ex.classList.add('show');
        $('#qNext').disabled = false;
        $('#qNext').focus();
        renderCatRow();
      };
    });

    $('#qNext').onclick = () => { idx++; renderQ(); };
    renderCatRow();
  }

  function renderStats() {
    const d = Progress.data.quiz;
    $('#quizSideStats').innerHTML = `
      <div class="grid g3" style="gap:12px">
        <div class="card" style="padding:16px;text-align:center"><b style="font-size:22px;font-family:var(--m);color:var(--cy)">${d.total}</b><div style="font-size:12px;color:var(--tx3)">累计答题</div></div>
        <div class="card" style="padding:16px;text-align:center"><b style="font-size:22px;font-family:var(--m);color:var(--gr)">${d.total ? Math.round(d.correct / d.total * 100) : 0}%</b><div style="font-size:12px;color:var(--tx3)">历史正确率</div></div>
        <div class="card" style="padding:16px;text-align:center"><b style="font-size:22px;font-family:var(--m);color:var(--ro)">${d.wrong.length}</b><div style="font-size:12px;color:var(--tx3)">错题待消灭</div></div>
      </div>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    shuffle();
    renderStats();
    Progress.onInit(renderStats);
  });
})();
