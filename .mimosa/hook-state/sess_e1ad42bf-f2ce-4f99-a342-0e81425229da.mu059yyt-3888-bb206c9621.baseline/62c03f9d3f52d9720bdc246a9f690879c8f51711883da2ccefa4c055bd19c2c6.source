/* home.js — 首页：交互式终端 / 模块进度 / 数字滚动 / 徽章墙 */
(function () {

  /* ============================================================
     交互式终端：打字机开场 → 可输入命令
     ============================================================ */
  const INTRO_LINES = [
    { c: 't-p', text: '$ whoami' },
    { c: 't-c', text: '> 蓝队见习分析师（就是你）' },
    { c: 't-p', text: '$ tail -f /var/log/soc/daily.log' },
    { c: 't-r', text: '[03:12] ALERT 检测到SQL注入尝试 src=45.83.66.10' },
    { c: 't-i', text: '        └─ 规则命中 → 自动拦截 ✓ 已生成工单' },
    { c: 't-r', text: '[08:55] ALERT 疑似勒索行为 host=FIN-03' },
    { c: 't-w', text: '        └─ 等待分析师研判……' },
    { c: 't-p', text: '$ ./become_guardian.sh --mode=零基础' },
    { c: 't-i', text: '> 欢迎来到安全运营学院 🛡️ 学习路径已加载' },
  ];

  const OPEN_TARGETS = {
    'home': 'index.html', 'index': 'index.html', '首页': 'index.html',
    'learn': 'learn.html', '学习': 'learn.html', '课程': 'learn.html',
    'm1': 'learn.html?m=1', 'm2': 'learn.html?m=2', 'm3': 'learn.html?m=3',
    'm4': 'learn.html?m=4', 'm5': 'learn.html?m=5', 'm6': 'learn.html?m=6', 'm7': 'learn.html?m=7',
    'games': 'games.html', '游戏': 'games.html',
    'log': 'games.html#log', 'phish': 'games.html#phish', 'sim': 'games.html#sim',
    'triage': 'games.html#triage', 'pwd': 'games.html#pwd',
    'quiz': 'quiz.html', '题库': 'quiz.html',
    'cases': 'cases.html', '案例': 'cases.html',
    'glossary': 'glossary.html', '术语': 'glossary.html',
  };

  const CMD_LIST = ['help', 'whoami', 'status', 'ls', 'open', 'daily', 'scan', 'trace', 'history', 'clear', 'banner', 'sudo', 'exit'];

  function initTerminal() {
    const box = document.getElementById('termBody');
    if (!box) return;
    box.innerHTML = '';

    let inputLine = null, input = null;
    let busy = false;             // 动画输出中禁止输入
    let dailyQ = null;            // 终端内答题状态
    const history = [];
    let histIdx = -1;

    function scrollBottom() { box.scrollTop = box.scrollHeight; }

    function print(html, cls = 't-c') {
      const div = document.createElement('div');
      div.className = 'ln ' + cls;
      div.innerHTML = html;
      box.insertBefore(div, inputLine);
      scrollBottom();
      return div;
    }

    function printLines(lines, done) {
      // 逐行带延迟输出（模拟真实终端），期间 busy
      busy = true;
      let i = 0;
      (function next() {
        if (i >= lines.length) { busy = false; if (done) done(); return; }
        const [html, cls, delay] = lines[i++];
        print(html, cls || 't-c');
        setTimeout(next, delay == null ? 120 : delay);
      })();
    }

    /* ---------- 命令实现 ---------- */
    function showHelp() {
      const rows = [
        ['help', '显示本帮助'],
        ['whoami', '你是谁（按等级回答）'],
        ['status', '学习进度 / XP / 徽章一览'],
        ['ls', '浏览本站目录'],
        ['open &lt;目标&gt;', '跳转页面：open m1~m7（模块）、open quiz / games / cases / glossary、open log / phish / sim / triage / pwd（游戏）'],
        ['daily', '在终端里做今日挑战（+40 XP）'],
        ['scan', '扫描本站端口（好玩）'],
        ['trace &lt;IP&gt;', '追踪一个可疑 IP'],
        ['clear', '清屏'],
      ];
      print('可用命令：', 't-i');
      rows.forEach(r => print(`  <span class="t-p">${r[0]}</span><span style="color:var(--tx3)"> — ${r[1]}</span>`));
      print('小提示：↑/↓ 翻历史命令，Tab 补全。试试 <span class="t-p">sudo rm -rf /</span> ？（别怕，是彩蛋）', 't-w');
    }

    function showWhoami() {
      const t = Progress.levelTitle();
      const xp = Progress.data.xp;
      print(`蓝队${t} · ${xp} XP`, 't-i');
      print(xp === 0 ? '  一张白纸的见习生——每位传奇守护者都是这么开始的 🌱' :
            xp < 500 ? '  告警分诊的手速正在养成，继续保持 💪' :
            xp < 1500 ? '  已经能独立处置大部分事件了，威胁猎手在向你招手 🔭' :
                        '  你已经是 SOC 里让人安心的存在了 🛡️');
    }

    function showStatus() {
      const d = Progress.data;
      const acc = d.quiz.total ? Math.round(d.quiz.correct / d.quiz.total * 100) : 0;
      const lessons = typeof LESSONS !== 'undefined' ? `${d.lessons.length}/${LESSONS.length}` : d.lessons.length;
      printLines([
        [`┌─ 作战状态 ─────────────────────`, 't-i', 60],
        [`│ 等级    Lv.${Progress.level()} · ${Progress.levelTitle()}`, '', 60],
        [`│ XP      ${d.xp}（距下一级还差 ${Math.max(0, Progress.nextLevelXp() - d.xp)}）`, '', 60],
        [`│ 课程    ${lessons} 节已完成`, '', 60],
        [`│ 题库    累计 ${d.quiz.total} 题 · 正确率 ${acc}%`, '', 60],
        [`│ 徽章    ${d.badges.length}/${Progress.badges().length} 枚`, '', 60],
        [`└───────────────────────────────`, 't-i', 60],
      ]);
    }

    function showLs() {
      print('secops-academy/', 't-i');
      const rows = [
        ['courses/   ', '7 大模块 27 节课（open m1 ~ m7）'],
        ['games/     ', '5 个闯关游戏（open log / phish / sim / triage / pwd）'],
        ['quiz/      ', '56 道练习题（open quiz）'],
        ['cases/     ', '4 个真实案例复盘（open cases）'],
        ['glossary/  ', '84 条术语速查（open glossary）'],
      ];
      rows.forEach(r => print(`  <span class="t-w">${r[0]}</span><span style="color:var(--tx2)"># ${r[1]}</span>`));
    }

    function doOpen(arg) {
      const target = OPEN_TARGETS[arg];
      if (!target) { print(`open: 未知目标「${escHtml(arg)}」，试试 open m1 或 open quiz（输入 ls 查看目录）`, 't-r'); return; }
      print(`正在跳转 → ${target} ...`, 't-i');
      setTimeout(() => { location.href = target; }, 500);
    }

    function doScan() {
      printLines([
        [`$ nmap -sV secops-academy.local`, 't-p', 200],
        [`Starting scan... 端口扫描是要授权的，本站已授权你自己 😄`, 't-c', 500],
        [`PORT     STATE  SERVICE`, 't-i', 260],
        [`22/tcp   closed ssh      <span style="color:var(--tx3)">（不开放的门才是好门）</span>`, '', 260],
        [`80/tcp   open   http     <span style="color:var(--tx3)">（欢迎来学）</span>`, '', 260],
        [`443/tcp  open   https    <span style="color:var(--tx3)">（加密✓）</span>`, '', 260],
        [`1337/tcp open   secops   <span style="color:var(--gr)">（守护者通道已开启 🛡️）</span>`, '', 260],
        [`Scan done: 1 host up. 未发现漏洞——因为你自己就是防线。`, 't-w', 400],
      ]);
    }

    function doTrace(arg) {
      const ip = arg || '45.83.66.10';
      printLines([
        [`$ traceroute ${escHtml(ip)}`, 't-p', 200],
        [` 1  gateway.local       0.4ms`, '', 240],
        [` 2  isp-core.net        8.2ms`, '', 240],
        [` 3  ???.evil-relay.net  66.6ms  <span class="t-r">← 攻击跳板！</span>`, '', 300],
        [` 4  包已拦截，攻击者已被瓦解 🎉`, 't-g', 300],
        [`（模拟剧情：真实追踪需要执法与运营商配合，蓝队负责的是发现与止损）`, 't-w', 300],
      ]);
    }

    function doDaily() {
      if (typeof QUIZ === 'undefined') { print('题库尚未加载', 't-r'); return; }
      if (Progress.dailyDoneToday()) {
        print('今日挑战已经完成过了，+40 XP 已入账。明天再来一题！', 't-w');
        return;
      }
      dailyQ = pickDailyQ();
      print(`📅 每日挑战：${dailyQ.q}`, 't-i');
      dailyQ.opts.forEach((o, i) => print(`  <span class="t-p">${i + 1}.</span> ${escHtml(o)}`));
      print('输入选项编号（1-4）：', 't-w');
    }

    function answerDaily(n) {
      const q = dailyQ; dailyQ = null;
      if (n < 1 || n > 4) { print('请输入 1-4 之间的编号', 't-r'); return; }
      const ok = (n - 1) === q.a;
      print(ok ? `✅ 答对了！正确答案：${'ABCD'[q.a]}. ${escHtml(q.opts[q.a])}` :
                 `❌ 正确答案：${'ABCD'[q.a]}. ${escHtml(q.opts[q.a])}`, ok ? 't-g' : 't-r');
      print(`💡 ${q.ex}`, 't-c');
      if (Progress.finishDaily()) {
        print('⚡ +40 XP 已到账（每日挑战）', 't-p');
        if (window.App) { App.confetti(45); App.toast('终端里也能做每日挑战！', '⌨️'); }
      }
    }

    function doSudo(rest) {
      if (/rm\s+-rf/.test(rest || '')) {
        printLines([
          [`[sudo] guardian 的密码：********`, 't-c', 400],
          [`🚫 权限不足：本终端禁止删除任何东西。`, 't-r', 350],
          [`（教学彩蛋：真实运维里 rm -rf 是最高危命令，执行前请三思并备份！）`, 't-w', 300],
        ]);
      } else {
        print('🚫 权限不足：这里只有学习是免 sudo 的 😄', 't-w');
      }
    }

    function run(raw) {
      const cmd = raw.trim();
      if (!cmd) return;
      history.unshift(cmd);
      histIdx = -1;
      // 回显输入行
      print(`<span class="t-p">soc-analyst@academy:~$</span> ${escHtml(cmd)}`, '');

      // 终端答题状态优先
      if (dailyQ) { answerDaily(parseInt(cmd, 10)); return; }

      const parts = cmd.split(/\s+/);
      const name = parts[0].toLowerCase();
      const rest = parts.slice(1).join(' ');

      switch (name) {
        case 'help': case '?': showHelp(); break;
        case 'whoami': showWhoami(); break;
        case 'status': case 'me': showStatus(); break;
        case 'ls': case 'dir': showLs(); break;
        case 'open': case 'cd': case 'go': doOpen((parts[1] || '').toLowerCase()); break;
        case 'daily': doDaily(); break;
        case 'scan': doScan(); break;
        case 'trace': doTrace(parts[1]); break;
        case 'history': history.slice(0, 10).reverse().forEach((h, i) => print(`  ${i + 1}  ${escHtml(h)}`, 't-c')); break;
        case 'clear': box.querySelectorAll('.ln:not(.ln-in)').forEach(el => el.remove()); break;
        case 'banner': print('🛡️ SecOps Academy — 把安全运营讲成人话', 't-i'); print('   learn · play · defend · repeat', 't-c'); break;
        case 'sudo': doSudo(rest); break;
        case 'exit': case 'logout': print('守护者的职责没有下班时间 🛡️（此终端无法退出）', 't-w'); break;
        case 'hack': case 'nmap': case 'ping': print(`bash: ${escHtml(name)}: 想练真功夫？去游戏区玩「日志侦探」→ open log`, 't-w'); break;
        default: print(`bash: ${escHtml(name)}: command not found（输入 help 查看可用命令）`, 't-r');
      }
    }

    /* ---------- 输入行 ---------- */
    function buildInputLine() {
      inputLine = document.createElement('div');
      inputLine.className = 'ln ln-in';
      inputLine.innerHTML = `<span class="ps1">soc-analyst@academy:~$</span>`;
      input = document.createElement('input');
      input.className = 'term-input';
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.setAttribute('aria-label', '终端命令输入');
      inputLine.appendChild(input);
      box.appendChild(inputLine);

      input.addEventListener('keydown', e => {
        if (busy) { e.preventDefault(); return; }
        if (e.key === 'Enter') {
          const v = input.value;
          input.value = '';
          run(v);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (history.length) { histIdx = Math.min(histIdx + 1, history.length - 1); input.value = history[histIdx] || ''; }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          histIdx = Math.max(histIdx - 1, -1);
          input.value = histIdx === -1 ? '' : (history[histIdx] || '');
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const cur = input.value.toLowerCase();
          const hit = CMD_LIST.find(c => c.startsWith(cur) && cur);
          if (hit) input.value = hit;
        }
      });
    }

    function escHtml(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // 点击终端任意处聚焦输入
    box.addEventListener('click', () => { if (input && !busy) input.focus({ preventScroll: true }); });

    // 打字机开场 → 交出控制权
    buildInputLine();
    inputLine.style.visibility = 'hidden';
    let li = 0;
    (function nextLine() {
      if (li >= INTRO_LINES.length) {
        print('输入 <span class="t-p">help</span> 查看可用命令，试着敲一个吧 ⌨️', 't-w');
        inputLine.style.visibility = 'visible';
        input.focus({ preventScroll: true });
        return;
      }
      const line = INTRO_LINES[li++];
      const div = print('', line.c);
      let ci = 0;
      (function tick() {
        if (ci <= line.text.length) {
          div.textContent = line.text.slice(0, ci);
          ci++;
          scrollBottom();
          setTimeout(tick, line.text.startsWith('$') ? 55 : 16);
        } else setTimeout(nextLine, 220);
      })();
    })();
  }

  /* 与 main.js 的每日挑战卡片同算法：按日期确定性抽题 */
  function pickDailyQ() {
    if (typeof QUIZ === 'undefined') return null;
    const seed = new Date().toISOString().slice(0, 10).split('-').join('');
    let idx = 0;
    for (const ch of seed) idx = (idx * 31 + ch.charCodeAt(0)) % 9973;
    return QUIZ[idx % QUIZ.length];
  }

  /* ---------- 数字滚动 ---------- */
  function countUp() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = +el.dataset.count;
      let cur = 0;
      const step = Math.max(1, Math.round(target / 30));
      const timer = setInterval(() => {
        cur += step;
        if (cur >= target) { cur = target; clearInterval(timer); }
        el.textContent = cur;
      }, 40);
    });
  }

  /* ---------- 学习路径卡片 ---------- */
  function renderModules() {
    const box = document.getElementById('homeModules');
    if (!box || typeof MODULES === 'undefined') return;
    const done = new Set(Progress.data.lessons);
    box.innerHTML = MODULES.map(m => {
      const list = LESSONS.filter(l => l.module === m.id);
      const d = list.filter(l => done.has(l.id)).length;
      const pct = Math.round(d / list.length * 100);
      const colorMap = { cy: 'rgba(34,211,238', li: 'rgba(163,230,53', ro: 'rgba(251,113,133', am: 'rgba(251,191,36', vi: 'rgba(139,92,246' };
      const c = colorMap[m.color] || colorMap.cy;
      return `
      <a class="card card-hov module-card" href="learn.html?m=${m.id}" style="text-decoration:none">
        <div class="m-icon" style="--ic-bg:${c},.12);--ic-bd:${c},.4)">${m.ico}</div>
        <h3>模块 ${m.id} · ${m.name}</h3>
        <p>${m.desc}</p>
        <div class="m-meta"><span>${list.length} 课 · ~${m.minutes} 分钟</span><span>${d}/${list.length} 已完成</span></div>
        <div class="m-prog"><span class="bar"><i style="width:${pct}%"></i></span><b style="color:${c},1)">${pct}%</b></div>
      </a>`;
    }).join('');
  }

  /* ---------- 继续学习 ---------- */
  function resume() {
    const btn = document.getElementById('resumeBtn');
    if (!btn) return;
    const next = LESSONS.find(l => !Progress.data.lessons.includes(l.id));
    if (!next) {
      btn.textContent = '🏆 全部课程已完成，去复习游戏吧 →';
      btn.href = 'games.html';
    } else {
      btn.textContent = `📖 继续学习：${next.title} →`;
      btn.href = `learn.html?l=${next.id}`;
    }
  }

  /* ---------- 徽章墙 ---------- */
  function renderBadges() {
    const box = document.getElementById('homeBadges');
    if (!box) return;
    box.innerHTML = Progress.badges().map(b => `
      <div class="badge-chip ${Progress.hasBadge(b.id) ? 'got' : ''}" title="${b.desc}">
        <span class="b-ico">${b.ico}</span><small>${b.name}</small>
      </div>`).join('');
  }

  /* ============================================================
     粒子成像（明日方舟式）：文字采样 → 鼠标斥力散开 → 弹簧归位
     ============================================================ */
  function initParticles() {
    const cvs = document.getElementById('heroParticles');
    const hero = document.getElementById('heroSec');
    if (!cvs || !hero || !cvs.getContext) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = cvs.getContext('2d');
    let W = 0, H = 0, parts = [];
    let PC = ['34,211,238', '139,92,246', '226,232,240'];
    const mouse = { x: -99999, y: -99999 };
    const R = 110, POWER = 2.0, SPRING = 0.02, FRICTION = 0.86;

    function readColors() {
      try {
        var cs = getComputedStyle(document.body);
        var a = ['--pc1', '--pc2', '--pc3'].map(function(k){ return cs.getPropertyValue(k).trim(); });
        if (a[0] && a[1] && a[2]) PC = a;
      } catch (e) {}
    }

    function build() {
      readColors();
      // 固定在视口：滚动时粒子层始终覆盖全屏，字形停在"中间偏上"
      W = cvs.width = window.innerWidth;
      H = cvs.height = window.innerHeight;
      if (!W || !H) return;
      const gap = W > 1800 ? 6 : 5;
      // 离屏绘制文字并采样像素
      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const o = off.getContext('2d');
      const size = Math.max(90, Math.min(W * 0.17, 230));
      o.font = '900 ' + size + 'px "Segoe UI","Microsoft YaHei",sans-serif';
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      o.fillStyle = '#fff';
      o.fillText('SECOPS', W / 2, H * 0.35);
      const data = o.getImageData(0, 0, W, H).data;
      parts = [];
      for (let y = 0; y < H; y += gap) {
        for (let x = 0; x < W; x += gap) {
          if (data[(y * W + x) * 4 + 3] > 128) {
            const c = Math.random();
            const col = c < 0.6 ? PC[0] : c < 0.88 ? PC[1] : PC[2];
            parts.push({
              x: Math.random() * W, y: Math.random() * H,   // 从随机位置飞入成形
              hx: x, hy: y, vx: 0, vy: 0,
              col, a: 0.3 + Math.random() * 0.5,
              ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 1.4,
            });
          }
        }
      }
    }

    let lastOp = '';
    function frame(t) {
      ctx.clearRect(0, 0, W, H);
      // 每帧校正调光（不依赖 scroll 事件，双保险）
      const hh = hero.offsetHeight || 1;
      const op = (1 - Math.min(1, Math.max(0, window.scrollY / hh)) * 0.75).toFixed(3);
      if (op !== lastOp) { lastOp = op; cvs.style.opacity = op; }
      const time = t * 0.001;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1;
          const f = (R - d) / R * POWER;
          p.vx += (dx / d) * f * 3.2;
          p.vy += (dy / d) * f * 3.2;
        }
        p.vx += (p.hx - p.x) * SPRING;
        p.vy += (p.hy - p.y) * SPRING;
        p.vx *= FRICTION; p.vy *= FRICTION;
        p.x += p.vx; p.y += p.vy;
        const tw = p.a * (0.72 + 0.28 * Math.sin(time * p.sp + p.ph));
        ctx.fillStyle = 'rgba(' + p.col + ',' + tw.toFixed(3) + ')';
        ctx.fillRect(p.x, p.y, 2, 2);
      }
      requestAnimationFrame(frame);
    }

    window.addEventListener('mousemove', e => {
      const r = cvs.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    window.addEventListener('touchmove', e => {
      const t0 = e.touches[0];
      if (!t0) return;
      const r = cvs.getBoundingClientRect();
      mouse.x = t0.clientX - r.left;
      mouse.y = t0.clientY - r.top;
    }, { passive: true });
    window.addEventListener('touchend', () => { mouse.x = -99999; mouse.y = -99999; });
    // 主题切换 → 粒子颜色跟随重建
    window.addEventListener('themechange', () => { readColors(); build(); });
    // 滚动调光：Hero 内全亮；滚过 Hero 后降为背景级水印（内容之下、背景之上）
    window.addEventListener('scroll', () => {
      const hh = hero.offsetHeight || 1;
      const ratio = Math.min(1, Math.max(0, window.scrollY / hh));
      cvs.style.opacity = (1 - ratio * 0.75).toFixed(3);
    }, { passive: true });
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    build();
    requestAnimationFrame(frame);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTerminal();
    initParticles();
    countUp();
    renderModules();
    resume();
    renderBadges();
    Progress.onInit(() => { renderModules(); renderBadges(); resume(); });
  });
})();
