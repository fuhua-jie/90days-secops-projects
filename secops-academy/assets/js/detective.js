/* ============================================================
   detective.js — 日志侦探取证终端（42 案 · 14 大日志类别）
   真实工作流：find 定位日志 → 三剑客+管道筛查 → check 提交结论
   案件数据在 det_cases.js（window.DET_CASES）
   ============================================================ */
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- 状态 ---------- */
  var box, inputLine, input;
  var cur = null;                 // 当前案件
  var VM = {};                    // 虚拟文件系统 {path: [lines]}
  var done = new Set();           // 已完成任务下标
  var hist = [], histIdx = -1;    // 命令历史
  var busy = false;               // 开场白播放中
  var pickCat = '全部', pickDiff = '全部';

  /* ---------- 输出 ---------- */
  function scrollBottom() { box.scrollTop = box.scrollHeight; }
  function print(html, cls) {
    var div = document.createElement('div');
    div.className = 'ln ' + (cls || 't-c');
    div.innerHTML = html;
    box.insertBefore(div, inputLine);
    scrollBottom();
  }
  function printRaw(t, cls) { print(esc(t), cls); }
  function printDelay(items, done_) {
    // items: [text, cls, delay] —— 逐条延迟输出，播放期间锁定输入
    busy = true;
    inputLine.style.visibility = 'hidden';
    var q = items.filter(function (it) { return it; });
    (function step() {
      if (!q.length) { busy = false; inputLine.style.visibility = 'visible'; input.focus({ preventScroll: true }); if (done_) done_(); return; }
      var it = q.shift();
      if (it[0]) printRaw(it[0], it[1]);
      setTimeout(step, it[2]);
    })();
  }

  /* ---------- 任务面板 ---------- */
  function pendingTasks() {
    if (!cur) return [];
    return cur.tasks.map(function (t, i) { return { t: t, i: i }; }).filter(function (x) { return !done.has(x.i); });
  }
  function updateSidebar() {
    if (!cur) return;
    var stars = '★'.repeat(cur.diff) + '☆'.repeat(3 - cur.diff);
    var mode = window.DIFF ? DIFF.lv('detective') : null;
    $('#curCase').innerHTML = '<span style="font-size:20px">' + cur.ico + '</span> <b style="color:var(--am)">' + esc(cur.title) + '</b><br>' + esc(cur.brief) +
      '<br><small style="color:var(--tx3);font-family:var(--m)">类别：' + esc(cur.cat) + ' · 难度：' + stars + ' · 任务 ' + done.size + '/' + cur.tasks.length + (mode ? ' · ' + mode.ico + ' ' + mode.name + '模式' : '') + '</small>';
    var pend = pendingTasks();
    $('#taskChecklist').innerHTML = cur.tasks.map(function (t, i) {
      var d = done.has(i), isCur = pend.length && pend[0].i === i;
      var extra = '';
      if (isCur && window.DIFF) {
        if (DIFF.showAnswer('detective')) extra = '<br><small style="color:var(--li)">✅ 答案：' + esc(t.ans[0]) + '</small>';
        else if (DIFF.showHint('detective')) extra = '<br><small style="color:var(--am)">💡 ' + esc(t.hint) + '</small>';
      }
      return '<div class="tc-item ' + (d ? 'done' : '') + ' ' + (isCur ? 'cur' : '') + '">' +
        '<span class="tc-dot">' + (d ? '✓' : isCur ? '▶' : '') + '</span><span>' + esc(t.q) + '</span>' + extra + '</div>';
    }).join('');
    $('#hintBtn').onclick = function () { if (!busy) hint(); };
  }

  /* ---------- 虚拟文件系统 ---------- */
  function findFile(arg) {
    if (VM[arg] != null) return VM[arg];
    var base = arg.split('/').pop();
    var keys = Object.keys(VM);
    for (var i = 0; i < keys.length; i++) {
      var kb = keys[i].split('/').pop();
      if (kb === base || keys[i].includes(base) || base.includes(kb)) return VM[keys[i]];
    }
    return undefined;
  }

  /* ---------- 命令实现 ---------- */
  function stageRun(cmd, args, stdin) {
    if (cmd === 'history') return { lines: hist.slice().reverse().map(function (h, i) { return '  ' + (i + 1) + '  ' + h; }) };
    var src = stdin;
    if (src == null) {
      var nonOpt = args.filter(function (x) { return x.charAt(0) !== '-'; });
      if (!nonOpt.length) return { error: cmd + ': 缺少输入（需要文件名或管道输入）' };
      var found = findFile(nonOpt[nonOpt.length - 1]);
      if (found == null) return { error: cmd + ': ' + nonOpt[nonOpt.length - 1] + ': 没有那个文件（试试 find / -name "*.log"）' };
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
      var mAll = prog.match(/\$(\d+|NF)/g); var fields = mAll ? mAll.map(function (x) { return x.slice(1); }) : ['0'];
      return { lines: src.map(function (l) {
        var parts = l.trim().split(/\s+/); if (!parts[0]) return '';
        return fields.map(function (f) { return f === 'NF' ? String(parts.length) : (parts[+f - 1] || ''); }).join(' ');
      }) };
    }
    if (cmd === 'sort') {
      var arr = src.slice();
      if (args.includes('-n')) arr.sort(function (a, b) {
        var ma = String(a).match(/-?\d+(\.\d+)?/g), mb = String(b).match(/-?\d+(\.\d+)?/g);
        return (ma ? +ma[ma.length - 1] : 0) - (mb ? +mb[mb.length - 1] : 0);
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
      var dirs = {};
      Object.keys(VM).forEach(function (k) { var p = k.split('/'); p.pop(); var c0 = ''; p.forEach(function (seg) { c0 += '/' + seg; dirs[c0] = 1; }); });
      var out = Object.keys(dirs).sort();
      Object.keys(VM).forEach(function (k) { out.push(k); });
      return { lines: out };
    }
    if (cmd === 'pwd') return { lines: ['/'] };
    if (cmd === 'find') {
      var nameI = args.indexOf('-name');
      if (nameI > -1 && args[nameI + 1]) {
        var pat = args[nameI + 1].replace(/\*/g, '');
        return { lines: Object.keys(VM).filter(function (k) { return k.includes(pat); }) };
      }
      return { lines: Object.keys(VM) };
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

  /* ---------- check 与胜利 ---------- */
  function norm(s) { return String(s).toLowerCase().trim().replace(/\s+/g, ' '); }
  function argMatch(a, k) {
    var u = norm(a), w = norm(k);
    return u === w || u.includes(w) || w.includes(u);
  }
  function doCheck(arg) {
    if (!cur) return;
    var pend = pendingTasks();
    if (!pend.length) { printRaw('本案全部任务已完成。', 't-w'); return; }
    if (!arg) { printRaw('用法：check <你的结论>（hint 获取提示）', 't-w'); return; }
    var hit = pend.find(function (x) { return x.t.ans.some(function (a) { return argMatch(arg, a); }); });
    if (!hit) {
      print('❌ 结论不成立，再查查日志。（hint 可获取提示）', 't-r');
      return;
    }
    done.add(hit.i);
    if (window.Progress && Progress.addXP) Progress.addXP(15, '侦探任务：' + hit.t.q);
    print('✅ 正确：' + esc(hit.t.q), 't-g');
    var left = pendingTasks();
    if (left.length) {
      printRaw('▶ 下一项：' + left[0].t.q, 't-i');
      if (window.DIFF && DIFF.showAnswer('detective')) printRaw('✅ 答案：check ' + left[0].t.ans[0], 't-g');
      else if (window.DIFF && DIFF.showHint('detective')) printRaw('💡 提示：' + left[0].t.hint, 't-w');
      updateSidebar();
    } else {
      updateSidebar();
      victory();
    }
  }
  function victory() {
    if (window.Progress && Progress.addXP) Progress.addXP(30, '案件告破');
    if (window.Progress && Progress.recordGame) Progress.recordGame('detective', 'W');
    printDelay([
      ['', 't-c', 60],
      ['╔══════════════════════════════════╗', 't-g', 60],
      ['║  🎉 案件告破：' + cur.title, 't-g', 60],
      ['╚══════════════════════════════════╝', 't-g', 60],
      ['', 't-c', 60],
      ['📚 侦探笔记：' + cur.teach, 't-w', 60],
      ['+30 XP · 本案任务全部完成！', 't-g', 60],
      ['（🔀 随机一案 或 📂 案情题库 继续探案）', 't-c', 60],
    ]);
  }

  /* ---------- 帮助 / 提示 ---------- */
  function showHelp() {
    [
      '════════ 日志侦探手册 ════════',
      '🔍 定位：find / -name "*.log" · ls · pwd',
      '📖 查看：cat <文件> · head/tail -n 5 <文件> · sed -n \'1,5p\' <文件>',
      '🔬 筛查：grep [选项] <模式> <文件>（-i 忽略大小写 -c 计数 -v 反选 -E 正则）',
      '         awk \'{print $1}\' 取列 · sort -n 排序 · uniq -c 去重计数 · wc 行数',
      '🧩 组合：cat f.log | grep FAIL | awk \'{print $5}\' | sort | uniq -c',
      '🧾 提交：check <结论> —— 逐项提交取证结论；hint 提示；task 待办清单',
      '⚙️ 其他：clear 清屏 · history 历史（↑↓ 也可翻）',
    ].forEach(function (l) { printRaw(l, 't-i'); });
  }
  function hint() {
    var pend = pendingTasks();
    if (!pend.length) { printRaw('本案已告破，无需提示。', 't-w'); return; }
    var t = pend[0].t;
    if (window.DIFF && DIFF.showAnswer('detective')) {
      printRaw('💡 提示：' + t.hint, 't-w');
      printRaw('✅ 新手模式·答案：check ' + t.ans[0], 't-g');
    } else if (window.DIFF && DIFF.showHint('detective')) {
      printRaw('💡 ' + t.hint, 't-w');
    } else {
      printRaw('🔒 当前难度不提供提示——取证侦探要靠自己的三剑客功夫。', 't-w');
    }
  }
  function showTasks() {
    if (!cur) return;
    printRaw('── 取证清单（' + done.size + '/' + cur.tasks.length + '）──', 't-i');
    cur.tasks.forEach(function (t, i) { printRaw((done.has(i) ? '✅ ' : '🔎 ') + t.q, done.has(i) ? 't-g' : 't-c'); });
  }

  /* ---------- 命令入口 ---------- */
  function run(raw) {
    var cmd = raw.trim();
    if (!cmd) return;
    hist.unshift(cmd); if (hist.length > 60) hist.pop(); histIdx = -1;
    print('<span class="t-p">detective@sec-lab:~$</span> ' + esc(cmd), '');
    var tokens = parseLine(cmd);
    var head = (tokens[0] || '').toLowerCase(), arg = tokens.slice(1).join(' ');
    if (head === 'help') return showHelp();
    if (head === 'clear') { box.querySelectorAll('.ln:not(.ln-in)').forEach(function (el) { el.remove(); }); return; }
    if (head === 'hint') return hint();
    if (head === 'task' || head === 'tasks') return showTasks();
    if (head === 'check') return doCheck(arg);
    var before = box.querySelectorAll('.ln').length;
    runPipeline(tokens);
    var after = box.querySelectorAll('.ln').length;
    if (after === before) printRaw('（无输出）', 't-w');
  }

  /* ---------- 案件装载 / 选择器 ---------- */
  function loadScenario(id) {
    cur = window.DET_CASES.find(function (s) { return s.id === id; }) || window.DET_CASES[0];
    done = new Set();
    VM = {};
    Object.keys(cur.files).forEach(function (k) { VM[k] = cur.files[k].slice(); });
    try { localStorage.setItem('det_last', cur.id); } catch (e) {}
    box.querySelectorAll('.ln:not(.ln-in)').forEach(function (el) { el.remove(); });
    updateSidebar();
    var stars = '★'.repeat(cur.diff) + '☆'.repeat(3 - cur.diff);
    printDelay([
      ['取证终端就绪 · 身份 日志侦探（只读权限）', 't-c', 160],
      ['', 't-c', 40],
      ['╔════════════════════════════════╗', 't-r', 60],
      ['║ ' + cur.ico + ' 案情：' + cur.title, 't-r', 60],
      ['╚════════════════════════════════╝', 't-r', 60],
      ['', 't-c', 40],
      [cur.brief, 't-c', 60],
      ['类别：' + cur.cat + ' · 难度：' + stars + ' · 待查 ' + cur.tasks.length + ' 项', 't-w', 60],
      ['▶ 任务 1：' + cur.tasks[0].q, 't-i', 80],
      (window.DIFF && DIFF.showAnswer('detective')) ? ['✅ 新手模式·答案：check ' + cur.tasks[0].ans[0], 't-g', 60] : null,
      (window.DIFF && DIFF.showHint('detective')) ? ['💡 提示：' + cur.tasks[0].hint, 't-w', 60] : null,
    ]);
  }
  function renderPicker() {
    var cats = ['全部'].concat(Array.from(new Set(window.DET_CASES.map(function (s) { return s.cat; }))));
    $('#pickerCats').innerHTML = cats.map(function (c) {
      return '<button class="chip ' + (c === pickCat ? 'on' : '') + '" data-c="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
    var diffs = ['全部', '★', '★★', '★★★'];
    $('#pickerDiffs').innerHTML = diffs.map(function (d) {
      return '<button class="chip ' + (d === pickDiff ? 'on' : '') + '" data-d="' + d + '">' + d + '</button>';
    }).join('');
    document.querySelectorAll('#pickerCats .chip').forEach(function (b) { b.onclick = function () { pickCat = b.dataset.c; renderPicker(); }; });
    document.querySelectorAll('#pickerDiffs .chip').forEach(function (b) { b.onclick = function () { pickDiff = b.dataset.d; renderPicker(); }; });
    var maxStar = window.DIFF ? DIFF.maxStar('detective') : 3;
    var list = window.DET_CASES.filter(function (s) {
      return (pickCat === '全部' || s.cat === pickCat) && (pickDiff === '全部' || '★'.repeat(s.diff) === pickDiff) && s.diff <= maxStar;
    });
    $('#pickCount').textContent = '· ' + list.length + ' 案' + (maxStar < 3 ? '（专家模式：仅 1-2 星）' : '');
    $('#pickerGrid').innerHTML = list.map(function (s) {
      var stars = '★'.repeat(s.diff) + '☆'.repeat(3 - s.diff);
      return '<div class="pick-card ' + (cur && s.id === cur.id ? 'playing' : '') + '" data-id="' + s.id + '">' +
        '<div class="p-top"><span class="p-ico">' + s.ico + '</span><b>' + esc(s.title) + '</b></div>' +
        '<small>' + esc(s.cat) + ' · ' + stars + '</small>' +
        '<small style="color:var(--tx2);font-family:var(--f)">' + esc(s.brief.slice(0, 30)) + '…</small>' +
      '</div>';
    }).join('');
    document.querySelectorAll('.pick-card').forEach(function (el) {
      el.onclick = function () { $('#pickerMask').classList.remove('open'); loadScenario(el.dataset.id); };
    });
  }
  function pickRandom() {
    var maxStar = window.DIFF ? DIFF.maxStar('detective') : 3;
    var pool = window.DET_CASES.filter(function (s) { return (!cur || s.id !== cur.id) && s.diff <= maxStar; });
    var last = null; try { last = localStorage.getItem('det_last'); } catch (e) {}
    if (pool.length > 1 && last) pool = pool.filter(function (s) { return s.id !== last; });
    var s = pool[Math.floor(Math.random() * pool.length)] || window.DET_CASES[0];
    loadScenario(s.id);
  }

  /* ---------- 初始化 ---------- */
  function buildInput() {
    inputLine = document.createElement('div');
    inputLine.className = 'ln ln-in';
    inputLine.innerHTML = '<span class="ps1">detective@sec-lab:~$</span>';
    input = document.createElement('input');
    input.className = 'term-input';
    input.autocomplete = 'off'; input.spellcheck = false;
    input.setAttribute('aria-label', '取证命令输入');
    inputLine.appendChild(input);
    box.appendChild(inputLine);
    input.addEventListener('keydown', function (e) {
      if (busy) { e.preventDefault(); return; }
      if (e.key === 'Enter') { var v = input.value; input.value = ''; run(v); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (hist.length) { histIdx = Math.min(histIdx + 1, hist.length - 1); input.value = hist[histIdx] || ''; } }
      else if (e.key === 'ArrowDown') { e.preventDefault(); histIdx = Math.max(histIdx - 1, -1); input.value = histIdx === -1 ? '' : (hist[histIdx] || ''); }
      else if (e.key === 'Tab') { e.preventDefault(); }
    });
    box.addEventListener('click', function () { if (input && !busy) input.focus({ preventScroll: true }); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.DET_CASES) return;
    box = document.getElementById('termBody');
    if (!box) return;
    box.innerHTML = '';
    buildInput();
    updateSidebar();
    document.getElementById('randomBtn').onclick = function () { pickRandom(); };
    document.getElementById('pickerBtn').onclick = function () { renderPicker(); document.getElementById('pickerMask').classList.add('open'); };
    document.getElementById('pickerClose').onclick = function () { document.getElementById('pickerMask').classList.remove('open'); };
    document.getElementById('pickerMask').addEventListener('click', function (e) { if (e.target === document.getElementById('pickerMask')) document.getElementById('pickerMask').classList.remove('open'); });
    document.getElementById('labReset').onclick = function () { if (cur) loadScenario(cur.id); };
    document.getElementById('hintBtn').onclick = function () { if (!busy) hint(); };
    // 难度选择卡（插入侧栏最上方）
    if (window.DIFF) {
      var side = document.querySelector('.lab-side');
      var card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = '<h4 style="font-size:14px;font-weight:800;margin-bottom:2px">🎚️ 难度模式</h4>' +
        '<small style="color:var(--tx3);font-size:11.5px" id="diffDesc"></small>' +
        '<div id="diffChips" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>';
      side.insertBefore(card, side.firstChild);
      var sync = function () { document.getElementById('diffDesc').textContent = DIFF.lv('detective').desc; updateSidebar(); };
      DIFF.mount('detective', card.querySelector('#diffChips'), function () {
        sync();
        if (DIFF.maxStar('detective') < 3 && cur && cur.diff > 2) pickRandom();
      });
      sync();
    }
    pickRandom();
  });
})();
