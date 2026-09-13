/* ============================================================
   ctf.js v6 — CTF 蓝队攻防排位赛（60 分钟实时 DFIR 对抗）
   · 蓝队 15 人（你 + 14 AI） vs 红队 5 攻击手
   · 红队全程随机攻击多名蓝队；同一成员在攻击解决前不会再被攻击；
     解决后进入 60-120s 休整
   · 每波攻击 = 真实取证流程：查日志溯源(check) → 隔离处置(block/isolate/rm/…)
   · 10 分钟防御窗口；防住 +25，超时 0 分（红队 +15 并造成损害）
   · 临时退出自动存档，下次继续（localStorage: ctf60_save）
   · 攻击剧本库独立在 ctf_cases.js（window.CTF6）
   · 支持管道 | 与分号 ； ；三剑客 grep/awk/sed 全支持
   ============================================================ */
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const r = n => Math.floor(Math.random() * n);
  const pick = a => a[r(a.length)];
  const pad = n => String(n).padStart(2, '0');
  const D = window.CTF6;

  /* ---------- 通用工具 ---------- */
  function fmtClock(s) { s = Math.max(0, s); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
  function norm(s) { return String(s).toLowerCase().trim().replace(/\s+/g, ' '); }
  function argMatch(typed, key) {
    var u = norm(typed), k = norm(key);
    if (!u || !k) return true;               // 空参数视为通配（如 hunt/ignore）
    return u === k || u.includes(k) || k.includes(u);
  }

  /* ---------- 状态 ---------- */
  var st = null, timer = null;
  var SAVE_KEY = 'ctf60_save';
  var box, inputLine, input;

  /* ============================================================
     终端输出
     ============================================================ */
  function scrollBottom() { box.scrollTop = box.scrollHeight; }
  function print(html, cls) {
    var div = document.createElement('div');
    div.className = 'ln ' + (cls || 't-c');
    div.innerHTML = html;
    box.insertBefore(div, inputLine);
    scrollBottom();
  }
  function printRaw(t, cls) { print(esc(t), cls); }
  function feed(html, color) {
    var el = document.createElement('div');
    el.className = 'feed-item new';
    if (color) el.style.color = color;
    el.innerHTML = html;
    var fd = $('#ctFeed');
    fd.prepend(el);
    while (fd.children.length > 80) fd.lastChild.remove();
  }
  function board() {
    var rows = [{ name: '蓝队·你', score: st.me, me: true }]
      .concat(st.mates.map(function (b) { return { name: '蓝队·' + b.name, score: b.score }; }))
      .concat(st.red.map(function (x) { return { name: x.name.split('（')[0] + '〔' + D.ACC[x.access] + '〕', score: x.score, red: true }; }));
    rows.sort(function (a, b) { return b.score - a.score; });
    var html = '';
    rows.slice(0, 10).forEach(function (x, i) {
      html += '<div class="lb-row' + (x.me ? ' me' : '') + (x.red ? '" style="color:var(--ro)' : '') + '">' +
        '<span class="lb-rank">' + (i + 1) + '</span>' +
        '<span class="lb-name">' + esc(x.name) + '</span>' +
        '<span class="lb-score">' + x.score + '</span></div>';
    });
    var mine = rows.findIndex(function (x) { return x.me; });
    if (mine >= 10) html += '<div class="lb-row me"><span class="lb-rank">' + (mine + 1) + '</span><span class="lb-name">蓝队·你</span><span class="lb-score">' + st.me + '</span></div>';
    $('#ctBoard').innerHTML = html;
  }
  function meters() {
    $('#ctBiz').textContent = Math.max(0, st.biz);
    $('#ctData').textContent = Math.max(0, st.data);
    $('#ctMy').textContent = st.me;
    $('#ctRed').textContent = st.red.reduce(function (s, x) { return s + x.score; }, 0);
    $('#ctActive').textContent = activeAll().length;
    $('#ctStopped').textContent = st.stopped;
  }
  function clock() {
    $('#ctTimer').textContent = fmtClock(st.total - st.t);
    $('#ctTimerBar').style.width = Math.min(100, st.t / st.total * 100) + '%';
  }

  /* ============================================================
     攻击调度
     ============================================================ */
  function activeAll() { return st.attacks.filter(function (x) { return x.state === 'active'; }); }
  function activeOnMe() { return st.attacks.filter(function (x) { return x.state === 'active' && x.target === 'you'; }); }
  function mateBusy(m) { return st.attacks.some(function (x) { return x.state === 'active' && x.target === m; }); }

  function spawnAttack() {
    var mem = pick(st.red);
    var stage = mem.chain[Math.min(mem.step, mem.chain.length - 1)];
    var STAGE_STAR = { 0: 1, 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3 };
    var maxStar = window.DIFF ? DIFF.maxStar('ctf') : 3;
    var okStar = function (a) { return (STAGE_STAR[a.st] || 3) <= maxStar; };
    var pool = D.A.filter(function (a) { return a.st === stage && a.pf.includes(mem.id) && okStar(a); });
    if (!pool.length) pool = D.A.filter(function (a) { return a.st <= stage && a.pf.includes(mem.id) && okStar(a); });
    if (!pool.length) pool = D.A.filter(function (a) { return a.pf.includes(mem.id) && okStar(a); });
    if (!pool.length) pool = D.A.filter(okStar);
    var atk = pick(pool);
    mem.step = Math.min(mem.step + 1, mem.chain.length - 1);

    var youFree = !activeOnMe().length && st.t >= (st.youCd || 0);
    var freeMates = st.mates.filter(function (m) { return !mateBusy(m) && st.t >= m.cdUntil; });
    var target = null;
    if (youFree && Math.random() < 0.3) target = 'you';
    else if (freeMates.length) target = pick(freeMates);
    else if (youFree) target = 'you';
    else { st.nextSpawnAt = st.t + 8; return; }        // 全员忙/休整，稍后再试

    var aid = ++st.aid;
    var c = { ip: D.rip(), host: D.rhost(), user: D.ruser(), dom: D.rdom() };
    var wv = atk.ev(c);
    var inst = {
      id: aid, atkName: atk.n, teach: atk.teach, ok: atk.ok, dmg: atk.dmg || {},
      memId: mem.id, redName: mem.name.split('（')[0],
      tel: wv.tel, files: wv.files,
      inv: wv.inv.map(function (q) { return { q: q.q, hint: q.hint, ans: q.ans, done: false }; }),
      need: wv.need.map(function (n) { return { cmd: n[0], arg: n[1], done: false }; }),
      target: target, born: st.t, remain: 600, state: 'active',
      assist: false, aiResolveAt: (target === 'you') ? 0 : st.t + 45 + r(45),
    };
    st.attacks.push(inst);

    if (target === 'you') {
      feed('🔴 <b>[A' + pad(aid) + ']</b> 你遭到 <b>' + esc(atk.n) + '</b>！10 分钟防御窗口开始', 'var(--ro)');
      printRaw('── 🚨 [A' + pad(aid) + '] ' + atk.n + ' —— 先取证溯源（check），再执行处置 ──', 't-r');
      pushConsole(inst);
    } else {
      feed('🔴 <b>[A' + pad(aid) + ']</b> ' + esc(mem.name.split('（')[0]) + ' 攻击 队友·' + esc(inst.target.name) + '：<b>' + esc(atk.n) + '</b>（assist A' + pad(aid) + ' 接管协防）', 'var(--ro)');
    }
  }

  /* ---------- 取证控制台 ---------- */
  function pushConsole(x, note) {
    st.consoleId = x.id;
    $('#ctWaveSrc').textContent = '取证防御台';
    $('#ctWaveSrc').className = 'src-badge src-EDR';
    $('#ctWaveTitle').textContent = '[A' + pad(x.id) + '] ' + x.atkName;
    $('#ctWaveTarget').textContent = '窗口剩余 ' + x.remain + 's';
    $('#ctTelemetry').innerHTML = x.tel.map(function (e) { return '· ' + esc(e); }).join('<br>');
    renderVerdict(x, note);
    $('#ctWaveName').textContent = '当前处置 [A' + pad(x.id) + ']';
    input.focus({ preventScroll: true });
  }
  function consoleStandby() {
    st.consoleId = null;
    $('#ctWaveSrc').textContent = '监控台';
    $('#ctWaveSrc').className = 'src-badge src-NDR';
    $('#ctWaveTitle').textContent = '监视中';
    $('#ctWaveTarget').textContent = '';
    $('#ctTelemetry').innerHTML = '等待下一波攻击……<br>队友被攻击的战况会实时出现在右侧，可随时 <b>assist A编号</b> 接管协防。<br>也可用 <b>attacks</b> 查看全场受攻击名单。';
    $('#ctVerdict').innerHTML = '';
    $('#ctWaveName').textContent = 'AWD 实时对抗';
  }
  function consoleAttack() {
    if (st.consoleId == null) return null;
    return st.attacks.find(function (x) { return x.id === st.consoleId; }) || null;
  }
  function nextConsole() {
    var mine = activeOnMe().sort(function (a, b) { return a.remain - b.remain; });
    if (mine.length) return pushConsole(mine[0]);
    var helped = activeAll().filter(function (x) { return x.assist; }).sort(function (a, b) { return a.remain - b.remain; });
    if (helped.length) return pushConsole(helped[0]);
    consoleStandby();
  }
  function renderVerdict(x, note) {
    var html = '';
    var pendInv = x.inv.filter(function (q) { return !q.done; });
    var pendNeed = x.need.filter(function (n) { return !n.done; });
    if (pendInv.length) {
      html += '<div style="font-size:12.5px;color:var(--am)">🔎 当前溯源任务：' + esc(pendInv[0].q) + '</div>';
      if (window.DIFF && DIFF.showAnswer('ctf')) {
        html += '<div style="font-size:12.5px;color:var(--li)">✅ 新手模式·答案：check ' + esc(pendInv[0].ans[0]) + '</div>';
        if (pendNeed.length) html += '<div style="font-size:12.5px;color:var(--li)">🛠️ 随后处置：' + pendNeed.map(function (n) { return '<code style="color:var(--cy)">' + esc(n.cmd) + (n.arg ? ' ' + esc(n.arg) : '') + '</code>'; }).join('、') + '</div>';
      } else if (window.DIFF && DIFF.showHint('ctf')) {
        html += '<div style="font-size:12.5px;color:var(--am)">💡 提示：' + esc(pendInv[0].hint) + '</div>';
      }
    } else if (pendNeed.length) {
      html += '<div style="font-size:12.5px;color:var(--li)">🛠️ 证据链完整！待执行处置：' +
        pendNeed.map(function (n) { return '<code style="color:var(--cy)">' + esc(n.cmd) + (n.arg ? ' ' + esc(n.arg) : '') + '</code>'; }).join('、') + '</div>';
    } else {
      html += '<div style="font-size:12.5px;color:var(--li)">全部处置已执行完毕。</div>';
    }
    if (note) html += '<div style="font-size:12.5px;margin-top:4px">' + note + '</div>';
    $('#ctVerdict').innerHTML = html;
  }

  /* ============================================================
     虚拟取证文件系统 + 命令引擎
     ============================================================ */
  function fsFiles() {
    var f = {};
    activeAll().forEach(function (x) { if (x.files) for (var k in x.files) f[k] = x.files[k]; });
    return f;
  }
  function findFile(arg) {
    var fs = fsFiles();
    if (fs[arg] != null) return fs[arg];
    var base = arg.split('/').pop();
    var keys = Object.keys(fs);
    for (var i = 0; i < keys.length; i++) {
      var kb = keys[i].split('/').pop();
      if (kb === base || keys[i].includes(base) || base.includes(kb)) return fs[keys[i]];
    }
    return undefined;
  }
  function stageRun(cmd, args, stdin) {
    if (cmd === 'history') return { lines: st.history.slice().reverse().map(function (h, i) { return '  ' + (i + 1) + '  ' + h; }) };
    var src = stdin;
    if (src == null) {
      var nonOpt = args.filter(function (x) { return x.charAt(0) !== '-'; });
      if (!nonOpt.length) return { error: cmd + ': 缺少输入（需要文件名或管道输入）' };
      var found = findFile(nonOpt[nonOpt.length - 1]);
      if (found == null) return { error: cmd + ': ' + nonOpt[nonOpt.length - 1] + ': 没有那个文件（试试 find /case）' };
      src = found.slice();
    }
    if (cmd === 'cat' || cmd === 'type') return { lines: src };
    if (cmd === 'grep') {
      var ig = args.includes('-i'), cnt = args.includes('-c'), invv = args.includes('-v'), ex = args.includes('-E');
      var nonOpt = args.filter(function (x) { return x.charAt(0) !== '-'; });
      if (!nonOpt.length) return { error: 'grep: 用法 grep [选项] <模式> <文件>' };
      var pat = nonOpt[0].replace(/^['"]|['"]$/g, '');
      var re; try { re = new RegExp(ex ? pat : pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ig ? 'i' : ''); } catch (e) { return { error: 'grep: 无效模式' }; }
      var out = src.filter(function (l) { return invv ? !re.test(l) : re.test(l); });
      return { lines: cnt ? [String(out.length)] : out };
    }
    if (cmd === 'sed') {
      var nonOpt2 = args.filter(function (x) { return x.charAt(0) !== '-'; });
      var expr = (nonOpt2[0] || '').replace(/^['"]|['"]$/g, '');
      var mP = expr.match(/^(\d+),(\d+)p$/);
      if (args.includes('-n') && mP) return { lines: src.slice(+mP[1] - 1, +mP[2]) };
      var mS = expr.match(/^s[/#](.*?)[/#](.*?)[/#]?([gi]*)$/);
      if (mS) { var re2; try { re2 = new RegExp(mS[1], mS[3] || ''); } catch (e2) { return { error: 'sed: 无效替换' }; } return { lines: src.map(function (l) { return l.replace(re2, mS[2]); }) }; }
      return { error: "sed: 支持 sed -n 'N,Mp' 与 s/旧/新/[g]" };
    }
    if (cmd === 'head' || cmd === 'tail') {
      var n = 10, ni = args.indexOf('-n');
      if (ni > -1 && args[ni + 1]) n = +args[ni + 1]; else { var m = args.find(function (x) { return /^-?\d+$/.test(x); }); if (m) n = Math.abs(+m); }
      return { lines: cmd === 'head' ? src.slice(0, n) : src.slice(-n) };
    }
    if (cmd === 'wc') return { lines: [String(src.length)] };
    if (cmd === 'awk') {
      var prog = args.find(function (x) { return x.charAt(0) === '{'; }) || args.find(function (x) { return x.includes('print'); });
      if (!prog) return { error: 'awk: 仅支持 {print $N} 形式' };
      var mAll = prog.match(/\$(\d+|NF)/g); var fields = mAll ? mAll.map(function (m) { return m.slice(1); }) : ['0'];
      return { lines: src.map(function (l) {
        var parts = l.trim().split(/\s+/); if (!parts[0]) return '';
        return fields.map(function (f) { return f === 'NF' ? String(parts.length) : (parts[+f - 1] || ''); }).join(' ');
      }) };
    }
    if (cmd === 'sort') {
      var arr = src.slice();
      if (args.includes('-n')) arr.sort(function (x, y) {
        var mx = String(x).match(/-?\d+(\.\d+)?/g), my = String(y).match(/-?\d+(\.\d+)?/g);
        return (mx ? +mx[mx.length - 1] : 0) - (my ? +my[my.length - 1] : 0);
      });
      else arr.sort();
      if (args.includes('-r')) arr.reverse();
      return { lines: arr };
    }
    if (cmd === 'uniq') {
      var cnt2 = args.includes('-c'), out = [], prev = null, c = 0;
      src.forEach(function (l) { if (l === prev) c++; else { if (prev != null) out.push(cnt2 ? String(c).padStart(7) + ' ' + prev : prev); prev = l; c = 1; } });
      if (prev != null) out.push(cnt2 ? String(c).padStart(7) + ' ' + prev : prev);
      return { lines: out };
    }
    return { error: cmd + ': 命令未实现' };
  }
  function execStage(tokens, stdin) {
    var cmd = tokens[0], args = tokens.slice(1);
    if (cmd === 'ls') {
      var fs = fsFiles(); var dirs = {};
      Object.keys(fs).forEach(function (k) { var p = k.split('/'); p.pop(); var cur = ''; p.forEach(function (seg) { cur += '/' + seg; dirs[cur] = 1; }); });
      var out = Object.keys(dirs).sort();
      Object.keys(fs).forEach(function (k) { out.push(k); });
      return { lines: out };
    }
    if (cmd === 'find') {
      var nameI = args.indexOf('-name');
      if (nameI > -1 && args[nameI + 1]) {
        var pat = args[nameI + 1].replace(/\*/g, '');
        return { lines: Object.keys(fsFiles()).filter(function (k) { return k.includes(pat); }) };
      }
      return { lines: Object.keys(fsFiles()) };
    }
    if (['cat', 'type', 'grep', 'sed', 'head', 'tail', 'wc', 'awk', 'sort', 'uniq', 'history'].includes(cmd))
      return stageRun(cmd, args, stdin);
    return { error: 'bash: ' + cmd + ': command not found（输 help 查看手册）' };
  }
  function parseLine(line) {
    var tokens = line.match(/'[^']*'|"[^"]*"|\S+/g) || [];
    return tokens.map(function (t) { return t.replace(/^['"]|['"]$/g, ''); });
  }
  function runPipeline(tokens) {
    var stdin = null, rest = tokens;
    while (rest.length) {
      var i = rest.indexOf('|');
      var seg = i === -1 ? rest : rest.slice(0, i);
      if (seg.length) {
        var res = execStage(seg, stdin);
        if (res.error) { printRaw(res.error, 't-r'); return; }
        if (i === -1) { (res.lines || []).forEach(function (l) { printRaw(l); }); return; }
        stdin = res.lines;
      }
      if (i === -1) return;
      rest = rest.slice(i + 1);
    }
  }

  /* ============================================================
     任务推进：check 溯源 + 处置命令
     ============================================================ */
  function doCheck(arg) {
    var x = consoleAttack();
    if (!x) { printRaw('check: 当前控制台没有需要溯源的攻击（attacks 查看全场）', 't-w'); return; }
    if (!arg) { renderVerdict(x, '用法：check &lt;答案&gt;'); return; }
    var pend = x.inv.filter(function (q) { return !q.done; });
    var hit = pend.find(function (q) { return q.ans.some(function (a) { return argMatch(arg, a); }); });
    if (hit) {
      hit.done = true;
      print('✅ 溯源正确：' + esc(hit.q), 't-g');
      var left = x.inv.filter(function (q) { return !q.done; });
      if (left.length) {
        printRaw('▶ 下一问：' + left[0].q, 't-i');
        if (window.DIFF && DIFF.showAnswer('ctf')) printRaw('✅ 新手模式·答案：check ' + left[0].ans[0], 't-g');
        else if (window.DIFF && DIFF.showHint('ctf')) printRaw('💡 提示：' + left[0].hint, 't-w');
        renderVerdict(x);
      }
      else {
        printRaw('🧾 证据链完整！现在执行处置命令（见下方待办）', 't-w');
        renderVerdict(x);
      }
    } else {
      print('❌ 答案不对。再仔细查查日志（输 hint 获取提示）', 't-r');
    }
  }
  function tryNeed(cmd, arg) {
    var x = consoleAttack();
    if (!x) return false;
    var NEEDS = ['block', 'isolate', 'kill', 'rm', 'passwd', 'disable', 'patch', 'restore', 'hunt', 'ignore'];
    if (!NEEDS.includes(cmd)) return false;
    var item = x.need.find(function (n) { return !n.done && n.cmd === cmd; });
    if (!item) return false;
    if (!argMatch(arg, item.arg)) {
      print(cmd + ': 目标不对——重读待办清单（应为 ' + item.cmd + ' ' + (item.arg || '（无参数）') + '）', 't-r');
      return true;
    }
    item.done = true;
    if (cmd === 'hunt') printRaw('🧭 全网回溯完成：同 Campaign 主机已全部排查。', 't-w');
    else if (cmd === 'restore') printRaw('💾 离线备份恢复流程已启动。', 't-w');
    else if (cmd === 'ignore') printRaw('✔ 已核实为正常业务/不可阻断行为，放行并归档。', 't-w');
    else printRaw('✔ ' + cmd + ' ' + (arg || '') + ' 执行成功。', 't-g');
    var pendN = x.need.filter(function (n) { return !n.done; });
    var pendI = x.inv.filter(function (q) { return !q.done; });
    if (!pendN.length && !pendI.length) resolveSuccess(x);
    else renderVerdict(x);
    return true;
  }
  function resolveSuccess(x) {
    x.state = 'saved';
    st.stopped++;
    var youPts = false;
    if (x.target === 'you') { st.me += 25; youPts = true; st.youCd = st.t + 60 + r(60); }
    else if (x.assist) { st.me += 25; x.target.score += 5; youPts = true; x.target.cdUntil = st.t + 60 + r(60); }
    else { x.target.score += 25; x.target.cdUntil = st.t + 60 + r(60); }
    var red = st.red.find(function (m) { return m.id === x.memId; });
    if (red) red.access = Math.max(0, red.access - 1);
    feed('🟢 <b>[A' + pad(x.id) + ']</b> ' + (youPts ? '你' : '队友·' + esc(x.target.name)) + ' 成功防御 ' + esc(x.atkName) + (youPts ? ' <b>+25</b>' : ''), 'var(--li)');
    printRaw('🎉 [A' + pad(x.id) + '] 防御成功 +25 —— ' + (x.ok || ''), 't-g');
    printRaw('📚 ' + x.teach, 't-i');
    meters(); board();
    st.consoleId = (st.consoleId === x.id) ? null : st.consoleId;
    nextConsole();
  }
  function loseAttack(x) {
    x.state = 'lost';
    st.missed++;
    st.biz = Math.max(0, st.biz - (x.dmg.biz || 0));
    st.data = Math.max(0, st.data - (x.dmg.data || 0));
    var red = st.red.find(function (m) { return m.id === x.memId; });
    if (red) { red.score += 15; red.access = Math.min(red.maxAccess, red.access + 1); }
    feed('💥 <b>[A' + pad(x.id) + ']</b> ' + (x.target === 'you' ? '你' : '队友·' + esc(x.target.name)) + ' 未能在窗口内防住 ' + esc(x.atkName) + '，红队 +15', 'var(--ro)');
    if (x.target === 'you') printRaw('💀 [A' + pad(x.id) + '] 防御窗口耗尽——' + x.atkName + ' 得手！业务 -' + (x.dmg.biz || 0) + ' 数据 -' + (x.dmg.data || 0), 't-r');
    meters(); board();
    if (x.target !== 'you' && x.assist) st.consoleId = (st.consoleId === x.id) ? null : st.consoleId;
    nextConsole();
  }
  function assist(arg) {
    var m = String(arg || '').match(/A?(\d+)/i);
    if (!m) { printRaw('用法：assist A编号（attacks 查看列表）', 't-w'); return; }
    var id = +m[1];
    var x = st.attacks.find(function (a) { return a.id === id && a.state === 'active' && a.target !== 'you'; });
    if (!x) { printRaw('assist: 没有这个进行中的队友攻击', 't-r'); return; }
    x.assist = true; x.aiResolveAt = 0;
    printRaw('🤝 已接管 [A' + pad(id) + '] ' + x.atkName + '（队友·' + x.target.name + ' 的告警日志已并入 /case/）', 't-w');
    pushConsole(x);
  }

  /* ============================================================
     主循环
     ============================================================ */
  function tick() {
    st.t++;
    clock();
    var act = activeAll();

    act.forEach(function (x) {
      x.remain--;
      if (st.consoleId === x.id) $('#ctWaveTarget').textContent = '窗口剩余 ' + Math.max(0, x.remain) + 's';
      if (x.target !== 'you' && x.aiResolveAt && st.t >= x.aiResolveAt) {
        if (Math.random() < 0.78) {
          x.state = 'saved'; x.target.score += 25; x.target.cdUntil = st.t + 60 + r(60); st.stopped++;
          var red = st.red.find(function (m) { return m.id === x.memId; });
          if (red) red.access = Math.max(0, red.access - 1);
          feed('🟢 <b>[A' + pad(x.id) + ']</b> 队友·' + esc(x.target.name) + ' 自己防住了 ' + esc(x.atkName) + ' +25', 'var(--li)');
        } else {
          x.aiResolveAt = st.t + 40 + r(30);
          feed('⚠️ <b>[A' + pad(x.id) + ']</b> 队友·' + esc(x.target.name) + ' 苦战中（可 assist 协防）', 'var(--am)');
        }
      }
    });

    act.filter(function (x) { return x.state === 'active' && x.remain <= 0; }).forEach(loseAttack);

    if (st.t >= st.nextSpawnAt) {
      if (activeAll().length < 7) spawnAttack();
      var prog = st.t / st.total;
      st.nextSpawnAt = st.t + Math.max(16, Math.round(40 - 22 * prog + r(12)));
    }
    if (st.t >= st.nextBenignAt) {
      var b = pick(D.BENIGN);
      feed('🟢 噪音事件：<b>' + esc(b.n) + '</b>（正常业务，无需处理）', 'var(--tx3)');
      st.nextBenignAt = st.t + 90 + r(60);
    }

    meters(); board();
    if (st.biz <= 0 || st.data <= 0) return endMatch('collapse');
    if (st.t >= st.total) return endMatch('time');
  }

  /* ============================================================
     存档 / 续战
     ============================================================ */
  function saveMatch() {
    if (!st || st.over) return;
    var data = {
      v: 6, total: st.total, t: st.t, me: st.me, biz: st.biz, data: st.data,
      stopped: st.stopped, missed: st.missed, aid: st.aid, youCd: st.youCd,
      nextSpawnAt: st.nextSpawnAt, nextBenignAt: st.nextBenignAt,
      history: st.history.slice(0, 30),
      mates: st.mates.map(function (m) { return { name: m.name, score: m.score, cdUntil: m.cdUntil }; }),
      red: st.red.map(function (x) { return { id: x.id, name: x.name, chain: x.chain, step: x.step, score: x.score, access: x.access, maxAccess: x.maxAccess }; }),
      attacks: st.attacks.filter(function (x) { return x.state === 'active'; }).map(function (x) {
        return {
          id: x.id, atkName: x.atkName, teach: x.teach, ok: x.ok, dmg: x.dmg, memId: x.memId, redName: x.redName,
          tel: x.tel, files: x.files,
          inv: x.inv, need: x.need.map(function (n) { return { cmd: n.cmd, arg: n.arg, done: n.done }; }),
          target: (x.target === 'you') ? 'you' : st.mates.indexOf(x.target),
          born: x.born, remain: x.remain, state: x.state, assist: x.assist, aiResolveAt: x.aiResolveAt,
        };
      }),
      savedAt: Date.now(),
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {}
  }
  function loadSave() {
    var raw;
    try { raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { raw = null; }
    if (!raw || raw.v !== 6 || raw.t >= raw.total) { localStorage.removeItem(SAVE_KEY); return false; }
    startMatch(raw);
    nextConsole();
    feed('💾 已恢复上次战局：剩余 <b>' + fmtClock(st.total - st.t) + '</b>，进行中的攻击 ' + st.attacks.filter(function (x) { return x.state === 'active'; }).length + ' 波', 'var(--am)');
    printRaw('💾 存档已恢复。剩余 ' + fmtClock(st.total - st.t) + '，输 help 查看手册。', 't-w');
    return true;
  }

  /* ============================================================
     开局 / 结算
     ============================================================ */
  function ratingInfo() {
    return {
      r: +(localStorage.getItem('ctf_rating') || 1000),
      w: +(localStorage.getItem('ctf_w') || 0),
      l: +(localStorage.getItem('ctf_l') || 0),
    };
  }
  function segName(v) { var s = D.SEGS.find(function (x) { return v >= x[0]; }); return s ? s[1] : D.SEGS[D.SEGS.length - 1][1]; }
  function refreshTags() {
    var info = ratingInfo();
    $('#segTag').textContent = '段位：' + segName(info.r);
    $('#ratingNow').textContent = info.r;
    $('#recTag').textContent = '战绩 ' + info.w + ' 胜 ' + info.l + ' 负';
  }
  function buildState(saved) {
    st = {
      total: (saved && saved.total) || 3600, t: (saved && saved.t) || 0,
      me: (saved && saved.me) || 0, biz: (saved && saved.biz) || 100, data: (saved && saved.data) || 100,
      stopped: (saved && saved.stopped) || 0, missed: (saved && saved.missed) || 0,
      aid: (saved && saved.aid) || 0, youCd: (saved && saved.youCd) || 0,
      nextSpawnAt: (saved && saved.nextSpawnAt) || 12,
      nextBenignAt: (saved && saved.nextBenignAt) || 75,
      history: (saved && saved.history) || [],
      mates: (saved && saved.mates ? saved.mates : D.BLUE_NAMES.map(function (n) { return { name: n, score: 0, cdUntil: 0 }; })),
      red: (saved && saved.red ? saved.red : D.RED.map(function (x) { return { id: x.id, name: x.name, chain: x.chain, step: 0, score: 0, access: 0, maxAccess: x.maxAccess }; })),
      attacks: [], consoleId: null, over: false,
    };
    ((saved && saved.attacks) || []).forEach(function (a) {
      a.target = (a.target === 'you') ? 'you' : st.mates[a.target];
      a.state = 'active';
      st.attacks.push(a);
      st.aid = Math.max(st.aid, a.id);
    });
    return st;
  }
  function startMatch(saved) {
    buildState(saved);
    $('#ctfStart').style.display = 'none';
    $('#ctfReport').style.display = 'none';
    $('#ctfConsole').style.display = '';
    box.querySelectorAll('.ln:not(.ln-in)').forEach(function (el) { el.remove(); });
    consoleStandby(); clock(); meters(); board();
    if (!saved) {
      printRaw('⚔️ 60 分钟 AWD 实时对抗开始！你与 14 名队友组成的蓝队对阵 5 名红队攻击手。', 't-w');
      printRaw('📡 你被攻击时会自动进入取证防御台：先 grep/awk 查日志溯源（check 答案），再执行处置命令。10 分钟窗口，防住 +25。', 't-c');
      printRaw('🤝 队友被攻击时输 assist A编号 可接管协防（+25，队友 +5）。随时 save 存档退出。', 't-i');
      if (window.DIFF) printRaw('🎚️ 难度模式：' + DIFF.lv('ctf').ico + ' ' + DIFF.lv('ctf').name + ' —— ' + DIFF.lv('ctf').desc, 't-w');
      printRaw('（输 help 查看完整命令手册）', 't-c');
    }
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 1000);
  }
  function endMatch(reason) {
    st.over = true;
    if (timer) { clearInterval(timer); timer = null; }
    localStorage.removeItem(SAVE_KEY);
    var blues = [{ name: '蓝队·你', me: true, score: st.me }].concat(st.mates.map(function (m) { return { name: '蓝队·' + m.name, score: m.score }; }));
    blues.sort(function (a, b) { return b.score - a.score; });
    var rank = blues.findIndex(function (x) { return x.me; }) + 1;
    var win = rank <= 5;
    var info = ratingInfo();
    if (win) { info.r += 20; info.w++; } else { info.r = Math.max(0, info.r - 12); info.l++; }
    localStorage.setItem('ctf_rating', info.r);
    localStorage.setItem('ctf_w', info.w);
    localStorage.setItem('ctf_l', info.l);
    if (window.Progress && Progress.recordGame) Progress.recordGame('ctf', win ? 'W' : 'L');
    var xp = 20 + st.stopped * 3 + (win ? 15 : 0);
    if (window.Progress && Progress.addXP) Progress.addXP(xp, 'CTF 对抗赛结算');

    var title = reason === 'collapse' ? '💥 防线崩溃提前结束' : (win ? '🏆 排位赛胜利' : '🛡️ 排位赛结束');
    var rows = blues.slice(0, 8).map(function (x, i) {
      return '<div class="lb-row' + (x.me ? ' me' : '') + '"><span class="lb-rank">' + (i + 1) + '</span><span class="lb-name">' + esc(x.name) + '</span><span class="lb-score">' + x.score + '</span></div>';
    }).join('');
    var atkRows = st.attacks.map(function (x) {
      var res = x.state === 'saved' ? (x.target === 'you' || x.assist ? '✅ 你防住' : '🟢 队友防住') : '❌ 失守';
      return '<tr><td style="padding:5px 10px">A' + pad(x.id) + '</td><td style="padding:5px 10px">' + esc(x.atkName) + '</td><td style="padding:5px 10px;color:var(--ro)">' + esc(x.redName) + '</td><td style="padding:5px 10px">' + res + '</td><td style="padding:5px 10px;font-family:var(--m)">' + fmtClock(x.born) + '</td></tr>';
    }).join('');
    var teaches = [];
    st.attacks.forEach(function (x) { if (x.state === 'saved' && teaches.indexOf(x.teach) === -1) teaches.push(x.teach); });

    $('#ctfConsole').style.display = 'none';
    $('#ctfReport').style.display = '';
    $('#ctfReport').innerHTML =
      '<div class="card" style="max-width:860px;margin:0 auto;padding:30px">' +
      '<h3 style="font-size:22px;font-weight:800">' + title + '</h3>' +
      '<div style="display:flex;gap:14px;flex-wrap:wrap;margin:14px 0">' +
      '<span class="tag cy">我的得分 <b>' + st.me + '</b>（蓝队第 ' + rank + '/15）</span>' +
      '<span class="tag">成功阻断 <b>' + st.stopped + '</b></span>' +
      '<span class="tag" style="color:var(--ro)">失守 <b>' + st.missed + '</b></span>' +
      '<span class="tag">业务可用性 <b>' + st.biz + '</b> · 数据安全 <b>' + st.data + '</b></span>' +
      '<span class="tag" style="color:var(--am)">+' + xp + ' XP · 排位分 ' + info.r + '</span>' +
      '</div>' +
      '<h4 style="font-size:14px;font-weight:800;margin:10px 0 8px">🏆 蓝队积分榜</h4><div>' + rows + '</div>' +
      '<h4 style="font-size:14px;font-weight:800;margin:16px 0 8px">📋 交战记录</h4>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12.5px;background:rgba(3,7,18,.5);border-radius:10px"><tbody>' + (atkRows || '<tr><td style="padding:8px 10px;color:var(--tx3)">本局无交战记录</td></tr>') + '</tbody></table>' +
      (teaches.length ? '<h4 style="font-size:14px;font-weight:800;margin:16px 0 8px">📚 本局学到</h4><div style="font-size:12.5px;line-height:2">' + teaches.map(esc).join('<br>') + '</div>' : '') +
      '<div style="text-align:center;margin-top:18px"><button class="btn btn-primary" onclick="location.reload()">再来一局</button></div>' +
      '</div>';
    refreshTags();
    if (win && window.App && App.confetti) App.confetti(90);
  }

  /* ============================================================
     命令入口
     ============================================================ */
  function showHelp() {
    [
      '════════ AWD 防御手册 ════════',
      '🔍 取证：find /case · ls · cat <文件> · grep [选项] <模式> <文件>',
      '         awk \'{print $N}\' · sed · head/tail · sort · uniq · wc（支持 | 管道与 ; 连续执行）',
      '🧾 溯源：check <答案> —— 逐项提交溯源结论；hint 获取提示；task 查看待办',
      '🛠️ 处置：block <IP/域名> 封禁 · isolate <主机> 隔离 · kill <进程> 杀进程',
      '         rm <文件/任务/服务> 删除 · disable <账号> 禁用 · passwd <账号> 重置口令',
      '         patch <组件> 修复 · restore backup 备份恢复 · hunt 全网回溯 · ignore 放行',
      '🤝 协防：attacks 查看全场受攻击名单 · assist A编号 接管队友攻击 · next 回到自己的攻击',
      '⚙️ 其他：status 战局 · save 存档退出 · clear 清屏',
    ].forEach(function (l) { printRaw(l, 't-i'); });
  }
  function showTasks() {
    var x = consoleAttack();
    if (!x) { printRaw('当前控制台没有进行中的攻击。attacks 查看全场。', 't-w'); return; }
    printRaw('── [A' + pad(x.id) + '] ' + x.atkName + ' 待办 ──', 't-i');
    x.inv.forEach(function (q) { printRaw((q.done ? '✅ ' : '🔎 ') + q.q, q.done ? 't-g' : 't-c'); });
    x.need.forEach(function (n) { printRaw((n.done ? '✅ ' : '🛠️ ') + n.cmd + (n.arg ? ' ' + n.arg : ''), n.done ? 't-g' : 't-c'); });
  }
  function showAttacks() {
    var act = activeAll();
    if (!act.length) { printRaw('全场暂无进行中的攻击。', 't-w'); return; }
    act.forEach(function (x) {
      printRaw('[A' + pad(x.id) + '] ' + (x.target === 'you' ? '⭐你' : '队友·' + x.target.name) +
        ' ← ' + x.atkName + '（' + x.redName + '）剩余 ' + Math.max(0, x.remain) + 's' + (x.assist ? ' · 已接管' : ''),
        x.target === 'you' ? 't-r' : 't-c');
    });
  }
  function status() {
    printRaw('剩余 ' + fmtClock(st.total - st.t) + ' · 业务 ' + st.biz + '/100 · 数据 ' + st.data + '/100 · 我的得分 ' + st.me + ' · 阻断 ' + st.stopped + ' · 失守 ' + st.missed);
  }
  function run(raw) {
    var cmd = raw.trim();
    if (!cmd) return;
    st.history.unshift(cmd); if (st.history.length > 80) st.history.pop();
    print('<span class="t-p">blue@awd:~$</span> ' + esc(cmd), '');
    var tokens = parseLine(cmd);
    var head = (tokens[0] || '').toLowerCase(), arg = tokens.slice(1).join(' ');

    if (head === 'help') return showHelp();
    if (head === 'clear') { box.querySelectorAll('.ln:not(.ln-in)').forEach(function (el) { el.remove(); }); return; }
    if (head === 'hint') {
      if (window.DIFF && !DIFF.showHint('ctf')) { printRaw('🔒 当前难度不提供提示——红队不会等你查手册。', 't-w'); return; }
      var x0 = consoleAttack();
      var q0 = x0 && x0.inv.find(function (q) { return !q.done; });
      if (q0) printRaw('💡 ' + q0.hint, 't-w');
      else if (x0) renderVerdict(x0);
      else printRaw('当前没有进行中的攻击。', 't-w');
      return;
    }
    if (head === 'task' || head === 'tasks') return showTasks();
    if (head === 'attacks') return showAttacks();
    if (head === 'status') return status();
    if (head === 'assist') return assist(arg);
    if (head === 'next') { nextConsole(); return; }
    if (head === 'save' || head === 'exit') { saveMatch(); printRaw('💾 已存档。关闭页面后下次打开点「继续上次战局」即可续战。', 't-w'); return; }
    if (head === 'check') return doCheck(arg);
    if (tryNeed(head, arg)) return;

    var before = box.querySelectorAll('.ln').length;
    runPipeline(tokens);
    var after = box.querySelectorAll('.ln').length;
    if (after === before) printRaw('（无输出）', 't-w');
  }

  /* ============================================================
     初始化
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    box = $('#ctTerm');
    if (!box || !window.CTF6) return;
    inputLine = box.querySelector('.ln-in');
    input = $('#ctInput');
    $('#ctSend').addEventListener('click', function () { if (st && !st.over) run(input.value); input.value = ''; input.focus({ preventScroll: true }); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { if (st && !st.over) run(input.value); input.value = ''; }
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        var hi = Math.min(+(input.dataset.hi || -1) + 1, st.history.length - 1);
        input.dataset.hi = hi;
        input.value = st.history[hi] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        var hd = Math.max(+(input.dataset.hi || 0) - 1, -1); input.dataset.hi = hd;
        input.value = hd === -1 ? '' : (st.history[hd] || '');
      }
    });
    box.addEventListener('click', function () { input.focus({ preventScroll: true }); });
    refreshTags();

    // 难度模式选择（开局画面）
    if (window.DIFF) {
      var drow = document.createElement('div');
      drow.style.cssText = 'margin:4px 0 14px';
      drow.innerHTML = '<div style="font-size:12px;color:var(--tx3);margin-bottom:6px">🎚️ 难度模式 <span id="ctfDiffDesc" style="color:var(--am)"></span></div><div id="ctfDiffChips" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"></div>';
      $('#startBtn').parentNode.insertBefore(drow, $('#startBtn'));
      var dsync = function () { var l = DIFF.lv('ctf'); document.getElementById('ctfDiffDesc').textContent = '当前：' + l.ico + ' ' + l.name + ' —— ' + l.desc; };
      DIFF.mount('ctf', document.getElementById('ctfDiffChips'), dsync);
      dsync();
    }

    var hasSave = false;
    try { var sv = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); hasSave = !!(sv && sv.v === 6 && sv.t < sv.total); } catch (e) {}
    if (hasSave) {
      var rb = $('#resumeBtn');
      rb.style.display = '';
      rb.onclick = function () { loadSave(); };
    }
    $('#startBtn').onclick = function () {
      if (hasSave) { if (!confirm('检测到上次战局存档。确定放弃并新开一局？')) return; localStorage.removeItem(SAVE_KEY); }
      startMatch(null);
    };

    window.addEventListener('beforeunload', saveMatch);
    window.addEventListener('pagehide', saveMatch);
    document.addEventListener('visibilitychange', function () { if (document.hidden) saveMatch(); });
  });
})();
