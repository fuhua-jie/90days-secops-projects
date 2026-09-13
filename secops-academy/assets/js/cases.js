/* cases.js — 案例复盘室：故事列表 / 阅读视图 / 互动抉择 */
(function () {
  const $ = s => document.querySelector(s);
  const KIND = {
    attack:   { cls: 'k-attack',   label: '攻击' },
    detect:   { cls: 'k-detect',   label: '发现' },
    response: { cls: 'k-response', label: '处置' },
    lesson:   { cls: 'k-lesson',   label: '教训' },
  };

  function renderHome() {
    $('#caseHome').innerHTML = `
      <div class="grid" style="gap:16px">
        ${CASES.map(c => `
        <div class="card card-hov case-card" data-c="${c.id}">
          <div class="c-ico">${c.ico}</div>
          <div style="flex:1">
            <h3 style="font-size:17px;font-weight:800">${c.title}</h3>
            <p style="color:var(--tx2);font-size:13.5px;margin-top:4px">${c.sub}</p>
            <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
              <span class="tag ro">${c.tag}</span>
              <span class="tag ${c.diff === 1 ? 'li' : c.diff === 2 ? 'am' : 'ro'}">${['', '入门案情', '进阶案情', '高难案情'][c.diff]}</span>
              <span class="tag">约 ${c.read} 分钟</span>
            </div>
          </div>
          <div style="align-self:center;color:var(--cy);font-weight:800">进入案件 ›</div>
        </div>`).join('')}
      </div>`;
    document.querySelectorAll('.case-card').forEach(el => {
      el.onclick = () => open(el.dataset.c);
    });
  }

  function open(id) {
    const c = CASES.find(x => x.id === id);
    let rightCount = 0, doneAll = false;

    $('#caseHome').style.display = 'none';
    const r = $('#caseReader');
    r.style.display = 'block';

    r.innerHTML = `
      <div class="card" style="margin-bottom:18px">
        <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
          <span style="font-size:44px">${c.ico}</span>
          <div style="flex:1;min-width:240px">
            <h3 style="font-size:20px;font-weight:800">${c.title}</h3>
            <p style="color:var(--tx2);font-size:13.5px;margin-top:4px">${c.sub}</p>
          </div>
          <button class="btn btn-ghost btn-sm" id="caseBack">← 返回列表</button>
        </div>
        <p style="color:var(--tx2);font-size:14px;margin-top:14px">${c.intro}</p>
      </div>

      <div class="card" style="margin-bottom:18px">
        <h3 style="font-size:16px;font-weight:800;margin-bottom:6px">🕰️ 事件时间线</h3>
        <div class="timeline">
          ${c.timeline.map(t => {
            const k = KIND[t.kind];
            return `<div class="tl-item ${k.cls}">
              <div class="tl-time">[${k.label}] ${t.time}</div>
              <h4>${t.title}</h4><p>${t.desc}</p>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card" style="margin-bottom:18px">
        <h3 style="font-size:16px;font-weight:800">🤔 关键抉择（你是当时的人）</h3>
        <p style="color:var(--tx2);font-size:13px;margin:4px 0 6px">选对 +8 XP。选完立刻看解析。</p>
        ${c.decisions.map((d, di) => `
        <div class="decision" data-di="${di}">
          <span class="d-tag">抉择 ${di + 1}/${c.decisions.length}</span>
          <h4>${d.q}</h4>
          <div class="sim-opts">${d.opts.map((o, oi) => `<button class="sim-opt" data-oi="${oi}">${o.t}</button>`).join('')}</div>
          <div class="sim-fb"></div>
        </div>`).join('')}
      </div>

      <div class="grid g2" style="gap:18px">
        <div class="card">
          <h3 style="font-size:16px;font-weight:800;margin-bottom:8px">🔗 攻击链（ATT&CK 视角）</h3>
          <div class="chain-chips">${c.chain.map(x => `<span class="tag vi">${x}</span>`).join('')}</div>
        </div>
        <div class="card">
          <h3 style="font-size:16px;font-weight:800;margin-bottom:8px">📋 整改清单（复盘产出）</h3>
          <ul style="margin-left:20px;font-size:13.5px;color:var(--tx2)">${c.lessons.map(l => `<li style="margin:6px 0">${l}</li>`).join('')}</ul>
        </div>
      </div>

      <div style="text-align:center;margin-top:22px">
        <a class="btn btn-primary" href="learn.html">📚 去补齐对应课程</a>
      </div>`;

    $('#caseBack').onclick = () => { r.style.display = 'none'; $('#caseHome').style.display = 'block'; window.scrollTo({ top: 0, behavior: 'smooth' }); };

    // 抉择交互
    r.querySelectorAll('.decision').forEach(dec => {
      const di = +dec.dataset.di;
      const d = c.decisions[di];
      dec.querySelectorAll('.sim-opt').forEach(btn => {
        btn.onclick = () => {
          const oi = +btn.dataset.oi;
          const opt = d.opts[oi];
          dec.querySelectorAll('.sim-opt').forEach(b => { b.disabled = true; });
          dec.querySelectorAll('.sim-opt').forEach((b, j) => {
            if (d.opts[j].ok) b.classList.add('right');
          });
          btn.classList.add(opt.ok ? 'right' : 'wrong');
          const fb = dec.querySelector('.sim-fb');
          fb.className = 'sim-fb show ' + (opt.ok ? 'ok' : 'no');
          fb.innerHTML = opt.fb;
          if (opt.ok) {
            rightCount++;
            Progress.bump('caseRight');
            Progress.addXP(8, '案例抉择正确');
          }
          if (di === c.decisions.length - 1 && !doneAll) {
            doneAll = true;
            if (rightCount === c.decisions.length) { App.toast(`完美复盘《${c.title}》！`, '🧩', true); App.confetti(40); }
          }
        };
      });
    });

    window.scrollTo({ top: 0 });
  }

  document.addEventListener('DOMContentLoaded', renderHome);
})();
