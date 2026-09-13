/* ============================================================
   App — 公共 UI：toast / 升级弹窗 / 撒花 / 导航高亮 / 每日挑战
   依赖：progress.js（页面按顺序先引 progress.js）
   ============================================================ */
(function () {
  const App = {
    /* ---------- toast ---------- */
    toast(html, icon = '✅', gold = false) {
      let wrap = document.querySelector('.toast-wrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'toast-wrap';
        document.body.appendChild(wrap);
      }
      const t = document.createElement('div');
      t.className = 'toast' + (gold ? ' gold' : '');
      t.innerHTML = `<span style="font-size:18px">${icon}</span><span>${html}</span>`;
      wrap.appendChild(t);
      setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 2600);
      while (wrap.children.length > 4) wrap.firstChild.remove();
    },

    /* ---------- 撒花 ---------- */
    confetti(n = 70) {
      const colors = ['#22d3ee', '#8b5cf6', '#a3e635', '#fbbf24', '#fb7185', '#e879f9'];
      for (let i = 0; i < n; i++) {
        const p = document.createElement('div');
        p.className = 'confetti';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.width = (6 + Math.random() * 7) + 'px';
        p.style.height = (8 + Math.random() * 9) + 'px';
        p.style.background = colors[i % colors.length];
        p.style.animationDuration = (2.2 + Math.random() * 1.8) + 's';
        p.style.animationDelay = (Math.random() * .5) + 's';
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 4800);
      }
    },

    /* ---------- 升级弹窗 ---------- */
    levelUp(level, title) {
      let mask = document.getElementById('levelupMask');
      if (!mask) {
        mask = document.createElement('div');
        mask.id = 'levelupMask';
        mask.className = 'levelup-mask';
        mask.innerHTML = `
          <div class="levelup">
            <div class="lu-stars">🌟</div>
            <h2>LEVEL UP!</h2>
            <div class="lu-title">Lv.<span id="luLevel"></span> · <span id="luTitle"></span></div>
            <p>警报警报！这位同学升级了 —— 继续保持，未来 SOC 靠你了 🛡️</p>
            <div style="margin-top:20px"><button class="btn btn-primary" id="luBtn">继续守护</button></div>
          </div>`;
        document.body.appendChild(mask);
        mask.querySelector('#luBtn').onclick = () => mask.classList.remove('open');
        mask.addEventListener('click', e => { if (e.target === mask) mask.classList.remove('open'); });
      }
      mask.querySelector('#luLevel').textContent = level;
      mask.querySelector('#luTitle').textContent = title;
      mask.classList.add('open');
      App.confetti(90);
    },

    /* ---------- 个人资料弹窗 ---------- */
    profile() {
      const d = Progress.data;
      let mask = document.getElementById('profileMask');
      if (!mask) {
        mask = document.createElement('div');
        mask.id = 'profileMask';
        mask.className = 'modal-mask';
        mask.innerHTML = `
          <div class="modal" style="max-width:640px">
            <div class="modal-head">
              <div><h3>🪪 我的作战档案</h3><div class="m-sub">数据保存在本地浏览器</div></div>
              <button class="modal-close" data-pf-close>✕</button>
            </div>
            <div class="modal-body">
              <div class="profile-stats" id="pfStats"></div>
              <h3 style="font-size:16px;margin-bottom:12px">🏅 徽章墙</h3>
              <div class="grid g4" id="pfBadges" style="gap:10px"></div>
              <div style="margin-top:20px;text-align:right">
                <button class="btn btn-sm btn-ghost" id="pfReset">清空全部进度</button>
              </div>
            </div>
          </div>`;
        document.body.appendChild(mask);
        mask.querySelector('[data-pf-close]').onclick = () => mask.classList.remove('open');
        mask.addEventListener('click', e => { if (e.target === mask) mask.classList.remove('open'); });
        mask.querySelector('#pfReset').onclick = () => {
          if (confirm('确定清空所有 XP、课程进度与徽章吗？')) {
            Progress.reset();
            mask.classList.remove('open');
            App.toast('进度已清空，一切从头再来 💪', '🧹');
            location.reload();
          }
        };
      }
      const acc = d.quiz.total ? Math.round(d.quiz.correct / d.quiz.total * 100) : 0;
      mask.querySelector('#pfStats').innerHTML = `
        <div class="ps"><b>${Progress.levelTitle()}</b><span>Lv.${Progress.level()} · ${d.xp} XP</span></div>
        <div class="ps"><b>${d.lessons.length}${typeof LESSONS !== 'undefined' ? '/' + LESSONS.length : ''}</b><span>课程完成</span></div>
        <div class="ps"><b>${acc}%</b><span>答题正确率（${d.quiz.correct}/${d.quiz.total}）</span></div>
        <div class="ps"><b>${d.daily || 0}</b><span>每日挑战次数</span></div>`;
      mask.querySelector('#pfBadges').innerHTML = Progress.badges().map(b => `
        <div class="badge-chip ${Progress.hasBadge(b.id) ? 'got' : ''}" title="${b.desc}">
          <span class="b-ico">${b.ico}</span><small>${b.name}</small>
        </div>`).join('');
      mask.classList.add('open');
    },

    /* ---------- 初始化 ---------- */
    init() {
      // 导航高亮
      const page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
      document.querySelectorAll('.nav a').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (href.replace('.html', '') === page) a.classList.add('active');
      });
      // XP pill 打开个人资料
      const pill = document.getElementById('xpPill');
      if (pill) pill.addEventListener('click', e => { e.preventDefault(); App.profile(); });
      Progress.onInit(() => Progress.bindUI());
      Progress.checkBadges();
      Progress.bindUI();

      // 每日挑战（首页有 #daily-quiz 容器时启用）
      const box = document.getElementById('daily-quiz');
      if (box && typeof QUIZ !== 'undefined') App.mountDaily(box);
    },

    /* ---------- 每日挑战（按日期确定性抽题） ---------- */
    mountDaily(box) {
      const seed = new Date().toISOString().slice(0, 10).split('-').join('');
      let idx = 0;
      for (const ch of seed) idx = (idx * 31 + ch.charCodeAt(0)) % 9973;
      const q = QUIZ[idx % QUIZ.length];
      const done = Progress.dailyDoneToday();

      box.innerHTML = `
        <span class="d-ico">📅</span>
        <div style="flex:1;min-width:240px">
          <h3>每日挑战 <span class="tag am" style="vertical-align:2px">+40 XP</span></h3>
          <p id="dq-q">${q.q}</p>
          <div id="dq-opts" class="grid" style="gap:8px;margin-top:10px"></div>
          <div class="explain-box" id="dq-ex"></div>
        </div>
        <div class="d-act" id="dq-side"></div>`;

      const optsBox = box.querySelector('#dq-opts');
      const side = box.querySelector('#dq-side');
      const keys = ['A', 'B', 'C', 'D'];

      if (done) {
        side.innerHTML = `<div style="text-align:center;color:var(--gr);font-weight:800;font-size:15px">✅ 今日已完成<br><small style="color:var(--tx3)">明天再来</small></div>`;
        optsBox.innerHTML = q.opts.map((o, i) =>
          `<div class="opt ${i === q.a ? 'right' : ''}" style="cursor:default">${keys[i]}. ${o}</div>`).join('');
        const ex = box.querySelector('#dq-ex');
        ex.innerHTML = `<b>解析：</b>${q.ex}`;
        ex.classList.add('show');
        return;
      }

      optsBox.innerHTML = q.opts.map((o, i) =>
        `<button class="opt" data-i="${i}"><span class="o-key">${keys[i]}</span>${o}</button>`).join('');
      optsBox.querySelectorAll('.opt').forEach(btn => {
        btn.onclick = () => {
          const i = +btn.dataset.i;
          optsBox.querySelectorAll('.opt').forEach((b, j) => {
            b.disabled = true;
            if (j === q.a) b.classList.add('right');
            else if (j === i) b.classList.add('wrong');
          });
          const ex = box.querySelector('#dq-ex');
          ex.innerHTML = `<b>解析：</b>${q.ex}`;
          ex.classList.add('show');
          const ok = i === q.a;
          if (Progress.finishDaily()) {
            side.innerHTML = `<div style="text-align:center;font-weight:800;color:${ok ? 'var(--gr)' : 'var(--am)'};font-size:15px">${ok ? '🎉 答对了！' : '答错也没关系'}<br><small style="color:var(--tx3)">+40 XP 已到账</small></div>`;
            App.confetti(50);
          }
        };
      });
    },
  };

  /* ---------- 主题系统 ---------- */
  function initTheme() {
    const THEMES = [
      { id: 'cyber', n: '赛博暗夜', sw: ['#22d3ee', '#8b5cf6', '#0b1220'] },
      { id: 'threeui', n: '深空玻璃', sw: ['#818cf8', '#c084fc', '#04050d'] },
      { id: 'aurora', n: '极光脉冲', sw: ['#34d399', '#22d3ee', '#03121c'] },
      { id: 'synth', n: '霓虹复古', sw: ['#f472b6', '#fb923c', '#0c0518'] },
      { id: 'kage', n: '墨夜禅境 Kage', sw: ['#dfe7e0', '#e0231c', '#05070a'] },
    ];
    function applyTheme(id, silent) {
      const t = THEMES.find(x => x.id === id) || THEMES[0];
      if (t.id === 'cyber') delete document.body.dataset.theme; else document.body.dataset.theme = t.id;
      localStorage.setItem('secops_theme', t.id);
      renderPanel();
      window.dispatchEvent(new CustomEvent('themechange'));
      if (!silent) App.toast('主题已切换：' + t.n, '🎨');
    }
    function renderPanel() {
      const cur = localStorage.getItem('secops_theme') || 'cyber';
      const list = document.getElementById('tpList');
      if (!list) return;
      list.innerHTML = '<h5>🎨 THEME · 选择主题</h5>' + THEMES.map(t => `
        <button class="theme-item ${t.id === cur ? 'on' : ''}" data-t="${t.id}">
          <span>${t.n}</span>
          <span class="sw">${t.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span>
        </button>`).join('') + '<div class="tp-tip">主题全站生效并自动记忆；终端面板保持深色控制台风。</div>';
      list.querySelectorAll('.theme-item').forEach(b => {
        b.onclick = () => applyTheme(b.dataset.t);
      });
    }
    const btn = document.createElement('button');
    btn.className = 'theme-btn'; btn.title = '切换主题'; btn.textContent = '🎨';
    const panel = document.createElement('div');
    panel.className = 'theme-panel'; panel.id = 'tpList';
    document.body.appendChild(panel);
    document.body.appendChild(btn);
    btn.onclick = () => { renderPanel(); panel.classList.toggle('open'); };
    document.addEventListener('click', e => {
      if (!panel.contains(e.target) && e.target !== btn) panel.classList.remove('open');
    });
    const saved = localStorage.getItem('secops_theme');
    if (saved && saved !== 'cyber') { document.body.dataset.theme = saved; }
    renderPanel();
  }

  /* ---------- 页面装饰：电影背景 / 顶栏隐藏 / 自定义光标 / 首页预加载 ---------- */
  function initChrome() {
    // WebGL 电影背景引擎（所有页面）
    var s = document.createElement('script');
    s.src = 'assets/js/bg3d.js';
    document.body.appendChild(s);

    // 顶栏：下滚隐藏、上滚出现
    var bar = document.querySelector('.topbar');
    var lastY = 0;
    if (bar) {
      window.addEventListener('scroll', function () {
        var y = window.scrollY;
        if (y > 140 && y > lastY + 8) bar.classList.add('hide');
        else if (y < lastY - 6 || y < 140) bar.classList.remove('hide');
        lastY = y;
      }, { passive: true });
    }

    // 自定义光标圆环（仅精确指针）
    if (window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches
        && !(matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      var d = document.createElement('div');
      d.className = 'cur-dot';
      document.body.appendChild(d);
      window.addEventListener('mousemove', function (e) {
        d.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      }, { passive: true });
      document.addEventListener('mouseover', function (e) {
        d.classList.toggle('act', !!e.target.closest('a,button,.opt,.lesson-item,.feed-item,input,.chip,.pick-card,.game-card'));
      });
    }

    // 首页预加载屏（每次进首页一小段启动仪式）
    if (/index\.html$/.test(location.pathname) || location.pathname === '/') {
      var pre = document.createElement('div');
      pre.id = 'pre';
      pre.innerHTML = '<div class="pre-in">' +
        '<div class="pre-mark">🛡️</div>' +
        '<div class="pre-jp">SECOPS ACADEMY</div>' +
        '<div class="pre-bar"><i id="pre-fill"></i></div>' +
        '<div class="pre-meta"><span>Raising the defense grid</span><b><span id="pre-pct">0</span>%</b></div></div>';
      document.body.prepend(pre);
      var p = 0;
      var iv = setInterval(function () {
        p = Math.min(100, p + 9 + Math.random() * 15);
        var fill = document.getElementById('pre-fill');
        var pct = document.getElementById('pre-pct');
        if (fill) fill.style.right = (100 - p) + '%';
        if (pct) pct.textContent = Math.round(p);
        if (p >= 100) {
          clearInterval(iv);
          setTimeout(function () { pre.classList.add('done'); setTimeout(function () { pre.remove(); }, 900); }, 220);
        }
      }, 65);
    }
  }

  window.App = App;
  document.addEventListener('DOMContentLoaded', () => { initTheme(); initChrome(); App.init(); });
})();
