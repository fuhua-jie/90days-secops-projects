/* learn.js — 课程中心：模块导航 / 课程列表 / 阅读弹窗 / 课内小测 */
(function () {
  let curModule = 1;
  let curLessonId = null;
  let firstOpen = true;

  const $ = s => document.querySelector(s);

  /* ---------- 渲染模块导航 ---------- */
  function renderNav() {
    const done = new Set(Progress.data.lessons);
    $('#moduleNav').innerHTML = MODULES.map(m => {
      const list = LESSONS.filter(l => l.module === m.id);
      const d = list.filter(l => done.has(l.id)).length;
      const pct = Math.round(d / list.length * 100);
      return `
      <div class="mnav-item ${m.id === curModule ? 'active' : ''}" data-m="${m.id}">
        <span class="n-ico">${m.ico}</span>
        <span class="n-txt"><b>${m.name}</b><span>${m.desc}</span></span>
        <span class="n-pct">${pct}%</span>
      </div>`;
    }).join('');
    document.querySelectorAll('.mnav-item').forEach(el => {
      el.onclick = () => { curModule = +el.dataset.m; renderNav(); renderList(); };
    });
  }

  /* ---------- 渲染课程列表 ---------- */
  function renderList() {
    const m = MODULES.find(x => x.id === curModule);
    const done = new Set(Progress.data.lessons);
    const list = LESSONS.filter(l => l.module === curModule);
    const d = list.filter(l => done.has(l.id)).length;

    $('#moduleIntro').innerHTML = `
      <span style="font-size:30px">${m.ico}</span>
      <div style="flex:1">
        <b style="font-size:16px">模块 ${m.id} · ${m.name}</b>
        <div style="font-size:13px;color:var(--tx2)">${m.desc}</div>
      </div>
      <span class="tag cy">${list.length} 课</span>
      <span class="tag li">${d}/${list.length} 已完成</span>`;

    $('#lessonList').innerHTML = list.map(l => {
      const isDone = done.has(l.id);
      return `
      <div class="lesson-item ${isDone ? 'done' : ''}" data-l="${l.id}">
        <div class="l-ico">${l.ico}</div>
        <div class="l-txt">
          <b>${l.title}</b>
          <span>${l.subtitle}</span>
        </div>
        <div class="l-right">
          ${isDone ? '<span class="done-mark">✓ 已完成</span>' : `<span class="tag ${['cy','li','ro','am','vi'][0]}">${l.minutes} 分钟</span>`}
          <span style="color:var(--tx3)">›</span>
        </div>
      </div>`;
    }).join('');

    document.querySelectorAll('.lesson-item').forEach(el => {
      el.onclick = () => openLesson(el.dataset.l);
    });
  }

  /* ---------- 渲染正文 block ---------- */
  function renderBlock(b) {
    switch (b.type) {
      case 'h': return `<h3>${b.text}</h3>`;
      case 'p': return `<p>${b.html}</p>`;
      case 'ul': return `<ul>${b.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
      case 'ol': return `<ol>${b.items.map(i => `<li>${i}</li>`).join('')}</ol>`;
      case 'callout': return `
        <div class="callout ${b.kind}">
          <span class="c-ico">${b.ico}</span>
          <div class="c-body"><b>${b.title}</b>${b.html}</div>
        </div>`;
      case 'code': {
        const esc = b.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<pre><code>${esc}</code></pre>`;
      }
      case 'table': return `
        <table><thead><tr>${b.head.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      default: return '';
    }
  }

  /* ---------- 打开课程 ---------- */
  function openLesson(id) {
    const l = LESSONS.find(x => x.id === id);
    if (!l) return;
    curLessonId = id;
    const idx = LESSONS.indexOf(l);
    const done = Progress.data.lessons.includes(id);

    $('#lsTitle').innerHTML = `${l.ico} ${l.title}`;
    $('#lsMeta').textContent = `模块 ${l.module} · ${l.subtitle} · 约 ${l.minutes} 分钟${done ? ' · ✅ 已完成' : ''}`;

    let html = l.content.map(renderBlock).join('');
    html += `<div class="takeaway"><b>📌 本课要点</b><ul>${l.takeaways.map(t => `<li>${t}</li>`).join('')}</ul></div>`;
    // 课内小测
    html += l.checks.map((c, ci) => `
      <div class="check-q" data-ci="${ci}">
        <div class="q-t">${c.q}</div>
        ${c.opts.map((o, oi) => `<button class="check-opt" data-oi="${oi}">${'ABCD'[oi]}. ${o}</button>`).join('')}
        <div class="check-ex">💡 ${c.ex}</div>
      </div>`).join('');
    $('#lsBody').innerHTML = html;
    $('#lsBody').scrollTop = 0;
    $('#lessonMask').scrollTop = 0;

    // 小测交互
    $('#lsBody').querySelectorAll('.check-q').forEach(qEl => {
      const ci = +qEl.dataset.ci;
      const check = l.checks[ci];
      qEl.querySelectorAll('.check-opt').forEach(btn => {
        btn.onclick = () => {
          const oi = +btn.dataset.oi;
          qEl.querySelectorAll('.check-opt').forEach((b, j) => {
            b.disabled = true;
            if (j === check.a) b.classList.add('right');
            else if (j === oi) b.classList.add('wrong');
          });
          qEl.querySelector('.check-ex').classList.add('show');
          if (oi === check.a) Progress.addXP(3, '课内小测答对');
        };
      });
    });

    // 完成按钮状态
    const doneBtn = $('#lsDone');
    doneBtn.disabled = done;
    doneBtn.textContent = done ? '✅ 本课已完成' : '✅ 我学会了，完成本课（+25 XP）';

    // 上一课/下一课
    $('#lsPrev').disabled = idx === 0;
    $('#lsNext').disabled = idx === LESSONS.length - 1;

    $('#lessonMask').classList.add('open');
    document.body.style.overflow = 'hidden';

    // 首次从 URL 直接打开时定位
    if (firstOpen) {
      const target = LESSONS.find(x => x.module === l.module && !Progress.data.lessons.includes(x.id));
      if (target && target.id !== id) { /* 仍保持用户点击的课程 */ }
      firstOpen = false;
    }
  }

  function closeLesson() {
    $('#lessonMask').classList.remove('open');
    document.body.style.overflow = '';
    renderNav(); renderList();
    const u = new URL(location); u.searchParams.delete('l'); history.replaceState(null, '', u);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // URL 参数
    const usp = new URLSearchParams(location.search);
    const wantM = +usp.get('m') || 0;
    const wantL = usp.get('l');
    if (wantM >= 1 && wantM <= MODULES.length) curModule = wantM;
    if (wantL) {
      const l = LESSONS.find(x => x.id === wantL);
      if (l) curModule = l.module;
    } else if (!wantM) {
      const firstUndone = LESSONS.find(l => !Progress.data.lessons.includes(l.id));
      if (firstUndone) curModule = firstUndone.module;
    }

    renderNav(); renderList();

    $('#lsClose').onclick = closeLesson;
    $('#lessonMask').addEventListener('click', e => { if (e.target === $('#lessonMask')) closeLesson(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#lessonMask').classList.contains('open')) closeLesson(); });

    $('#lsDone').onclick = () => {
      if (!curLessonId) return;
      if (Progress.completeLesson(curLessonId)) App.confetti(45);
      openLesson(curLessonId); // 刷新按钮态
    };
    $('#lsPrev').onclick = () => { const i = LESSONS.findIndex(l => l.id === curLessonId); if (i > 0) openLesson(LESSONS[i - 1].id); };
    $('#lsNext').onclick = () => { const i = LESSONS.findIndex(l => l.id === curLessonId); if (i < LESSONS.length - 1) openLesson(LESSONS[i + 1].id); };

    if (wantL) setTimeout(() => openLesson(wantL), 60);
  });
})();
