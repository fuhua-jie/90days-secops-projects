/* ============================================================
   hwv.js — 护网行动模拟器引擎（HVV 蓝队防守实战）
   · 战前 8 项决策 → 战时 N 天 7×24 值守 → 每日战报 → 结算评级
   · 红队 6 队按真实 kill chain 推进：打点→落地→横向→集权→靶标
   · 玩家动作：研判上报 / 封禁 / 隔离 / 终端溯源 trace / 反制 counter
   · 裁判仲裁：真实攻击上报得分、误报上报扣分、漏看被通报
   · 溯源：日志证据（/hw/）→ trace IP → trace 队 → 蜜罐样本 trace 人
   · 存档续战：localStorage hwv_save
   ============================================================ */
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const r = n => Math.floor(Math.random() * n);
  const pick = a => a[r(a.length)];
  const D = window.HWV;

  var st = null, timer = null;
  var box, inputLine, input;
  var SAVE_KEY = 'hwv_save';
  var DAY_LEN = 90;                       // 每值守日压缩为 90 秒实时

  /* ---------- 工具 ---------- */
  function fmtClock(s) { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
  function dayPhase(t) { return (t % DAY_LEN) < DAY_LEN * 0.62 ? '日班' : '夜班'; }
  function nowStr() {
    var d = st.day, sec = st.t % DAY_LEN;
    var hh = (8 + Math.floor(sec / DAY_LEN * 24)) % 24;
    return 'D' + d + ' ' + String(hh).padStart(2, '0') + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
  }

  /* ============================================================
     战前准备
     ============================================================ */
  var prepIdx = 0, prepFx = null;
  function startPrep(days) {
    st = { phase: 'prep', days: days, day: 0 };
    prepIdx = 0; prepFx = {};
    $('#hwStart').style.display = 'none';
    $('#hwReport').style.display = 'none';
    $('#hwPrep').style.display = '';
    renderPrep();
  }
  function renderPrep() {
    var card = D.PREP[prepIdx];
    $('#prepIdx').textContent = prepIdx + 1;
    $('#prepBar').style.width = (prepIdx / D.PREP.length * 100) + '%';
    $('#prepCard').innerHTML =
      '<div style="font-size:34px">' + card.ico + '</div>' +
      '<h4 style="font-size:17px;font-weight:800;margin:6px 0 4px">' + card.title + '</h4>' +
      '<p style="color:var(--tx2);font-size:13px;margin:0 0 14px">' + esc(card.desc) + '</p>' +
      card.options.map(function (o, i) {
        return '<button class="prep-opt" data-i="' + i + '" style="display:block;width:100%;text-align:left;background:rgba(10,16,32,.6);border:1px solid var(--line);border-radius:10px;padding:11px 14px;margin-bottom:8px;cursor:pointer;transition:border-color .15s">' +
          '<b style="font-size:13.5px">' + esc(o.label) + '</b>' +
          '<span style="display:block;color:var(--tx3);font-size:12px;margin-top:2px">' + esc(o.desc) + '</span></button>';
      }).join('');
    document.querySelectorAll('.prep-opt').forEach(function (b) {
      b.onmouseenter = function () { b.style.borderColor = 'var(--cy)'; };
      b.onmouseleave = function () { b.style.borderColor = 'var(--line)'; };
      b.onclick = function () {
        var o = card.options[+b.dataset.i];
        for (var k in o.fx) prepFx[k] = o.fx[k];
        prepIdx++;
        if (prepIdx < D.PREP.length) renderPrep();
        else finishPrep();
      };
    });
  }
  function finishPrep() {
    $('#prepBar').style.width = '100%';
    $('#prepCard').innerHTML =
      '<div style="text-align:center;padding:10px 0 4px">' +
      '<div style="font-size:34px">✅</div>' +
      '<h4 style="font-size:17px;font-weight:800;margin:8px 0 8px">战前准备完成</h4>' +
      '<p style="color:var(--tx2);font-size:13px;line-height:2">' +
      (prepFx.shadow === 0 ? '影子资产：已全部清查<br>' : '影子资产：<b style="color:var(--ro)">' + prepFx.shadow + ' 个未发现</b>（战时可能被当跳板）<br>') +
      (prepFx.honey > 0 ? '蜜罐：已部署（' + (prepFx.honey === 2 ? '高交互' : '低交互') + '）<br>' : '蜜罐：<b style="color:var(--ro)">未部署</b><br>') +
      (prepFx.log === 2 ? '溯源能力：全流量回溯<br>' : prepFx.log === 1 ? '溯源能力：日志集中<br>' : '溯源能力：<b style="color:var(--ro)">日志分散</b><br>') +
      '</p><button class="btn btn-primary" id="goBattle" style="margin-top:10px">🪖 进入战时值守</button></div>';
    $('#goBattle').onclick = function () { startBattle(); };
  }

  /* ============================================================
     开战 / 状态构建
     ============================================================ */
  function buildState(fx, saved) {
    st = saved || {
      phase: 'battle', days: (fx && fx.__days) || 7, day: 1, t: 0,
      score: 10000, targets: { main: 1, oa: 1, db: 1 }, lost: 0,
      bans: [], alerts: [], aid: 0,
      reds: D.REDS.map(function (x) { return { id: x.id, name: x.name, alias: x.alias, skill: x.skill, styles: x.styles, ip: newIp(), camp: null, score: 0, disableDay: 0, metZero: false }; }),
      units: D.UNITS.filter(function (n) { return n !== '我方单位'; }).map(function (n) { return { name: n, score: 10000 }; }),
      honey: fx.honey || 0, clues: [], counters: 0,
      fx: fx, files: {}, feedCount: 0,
      nextNoiseAt: 6, nextPartnerAt: 40, nextUnitAt: DAY_LEN * 0.9,
      stats: { reported: 0, falseReport: 0, blocked: 0, isolated: 0, missed: 0, traced: 0, countered: 0, falseBan: 0, targetLost: 0, assetLost: 0 },
      history: [], over: false, zeroday: null,
    };
    st.dayLen = DAY_LEN;
    if (saved) st.phase = 'battle';
    return st;
  }
  function newIp() { return pick(D.IP_POOLS) + (2 + r(250)); }

  function startBattle(saved) {
    if (!saved) { st = buildState(Object.assign({ __days: st.days }, prepFx), null); }
    else { st = buildState(null, saved); }
    $('#hwStart').style.display = 'none';
    $('#hwPrep').style.display = 'none';
    $('#hwReport').style.display = 'none';
    $('#hwBattle').style.display = '';
    box.querySelectorAll('.ln:not(.ln-in)').forEach(function (el) { el.remove(); });
    st.day = st.day || 1;
    dayStart(false);
    if (!saved) {
      termPrint('🪖 护网行动开始！共 ' + st.days + ' 个值守日（每日压缩为实时 90 秒）。', 't-w');
      termPrint('左侧为 SIEM 告警队列：逐条研判——上报裁判得分、封禁攻击源、隔离失陷主机；漏看会被通报。', 't-c');
      termPrint('本终端可查 /hw/ 日志溯源：trace <IP> → trace <队名> → 蜜罐样本 trace <人名> → counter 反制。输 help 查看手册。', 't-i');
      if (window.DIFF) termPrint('🎚️ 难度模式：' + DIFF.lv('hwv').ico + ' ' + DIFF.lv('hwv').name + ' —— ' + DIFF.lv('hwv').desc, 't-w');
    } else {
      termPrint('💾 演练已恢复：D' + st.day + '，得分 ' + st.score + '。', 't-w');
    }
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 1000);
  }

  function dayStart(resume) {
    var d = st.day;
    D.FEED.start.forEach(function (m, i) { if (d === 1 && i < 1) feed(m); });
    if (d === 1) D.FEED.start.slice(1).forEach(feed);
    else if (d === 2) feed(D.FEED.start[2]);
    // 红队换源 + 当日战役规划
    st.reds.forEach(function (rd) {
      rd.ip = newIp();
      rd.camp = null;
      rd.metZero = (st.zeroday === d) && (rd.id === 'pj' || Math.random() < 0.3);
      if (!resume && Math.random() < campProb(rd) && st.day > rd.disableDay) {
        var delay = 5 + r(Math.floor(DAY_LEN * (Math.random() < 0.4 ? 0.6 : 0.3)));
        rd.camp = { steps: planCampaign(rd), idx: 0, at: st.t + delay, waiting: false, srcIp: rd.ip, hitHoney: false };
      }
    });
    if (d === Math.max(2, st.days - 2) && !st.zeroday) {
      st.zeroday = d + r(2);
      feed(D.FEED.zeroday[0], 'var(--ro)');
    }
    termPrint('── D' + d + ' 值守开始（' + (st.day > 1 ? '红队已更换攻击源 IP' : '攻击源已就位') + '）──', 't-i');
    writeLog('fw.log', '== D' + d + ' 值守开始 ==');
    renderAlerts(); board(); meters();
  }
  function campProb(rd) {
    var ramp = Math.min(1, 0.5 + st.day * 0.05) * rd.skill;
    return ramp * (1 - (st.fx.expose || 0));
  }

  /* ---------- 战役规划：按风格排 kill chain ----------
     星级：侦察/爆破/钓鱼 1★ · 利用/Webshell/供应链 2★ · 横向/集权/靶标/0day 3★
     专家模式只遭遇 1-2 星攻击（无横向/集权/0day/碰靶） */
  function planCampaign(rd) {
    var style = pick(rd.styles);
    var chains = {
      scan:    ['recon', 'exploit', 'webshell', 'exfil'],
      brute:   ['brute', 'brute', 'lateral', 'exfil'],
      phish:   ['phish0', 'phish1', 'lateral', 'exfil'],
      exploit: ['exploit', 'webshell', 'lateral', 'exfil'],
      zeroday: ['zeroday', 'webshell', 'dc', 'exfil'],
      supply:  ['supply', 'lateral', 'dc', 'exfil'],
      lateral: ['lateral', 'dc', 'exfil'],
      dc:      ['dc', 'exfil'],
    };
    if (window.DIFF && DIFF.maxStar('hwv') < 3) {
      var easy = {
        scan:    ['recon', 'exploit', 'webshell'],
        brute:   ['brute', 'brute'],
        phish:   ['phish0', 'phish1'],
        exploit: ['exploit', 'webshell'],
        zeroday: ['exploit', 'webshell'],
        supply:  ['supply', 'webshell'],
        lateral: ['recon', 'webshell'],
        dc:      ['exploit', 'webshell'],
      };
      chains = easy;
    }
    return (chains[style] || chains.exploit).slice();
  }

  /* ============================================================
     主循环
     ============================================================ */
  function tick() {
    if (!st || st.phase !== 'battle') return;
    st.t++;
    var secInDay = st.t % DAY_LEN;
    $('#hbTimer').textContent = fmtClock(DAY_LEN * st.days - st.t);
    $('#hbTimerBar').style.width = (st.t / (DAY_LEN * st.days) * 100) + '%';
    $('#hbPhase').textContent = 'D' + st.day + ' · ' + dayPhase(st.t);

    // —— 噪音/白名单告警流 ——
    if (st.t >= st.nextNoiseAt) {
      if (Math.random() < 0.07) emitIntel(); else emit(pick(D.NOISE));
      st.nextNoiseAt = st.t + 7 + r(8);
    }
    if (st.t >= st.nextPartnerAt) {
      emitPartner();
      st.nextPartnerAt = st.t + 40 + r(30);
    }
    var expired = st.alerts.some(function (a) { return (!a.real && st.t >= a.until) || (a.real && !a.team && st.t >= a.until); });
    if (expired) {
      st.alerts.forEach(function (a) { if (a.real && !a.team && st.t >= a.until && !a.handled && !a.reported) { a.missed = true; st.stats.missed++; } });
      st.alerts = st.alerts.filter(function (a) { return (a.real && a.team) || st.t < a.until; });
      renderAlerts();
    }

    // —— 红队战役推进 ——
    st.reds.forEach(function (rd) {
      var c = rd.camp;
      if (!c) return;
      if (c.idx >= c.steps.length) { rd.camp = null; return; }
      if (!c.waiting) {
        if (st.t >= c.at) { startStep(rd, c); }
        return;
      }
      // 当前步等待落地
      if (st.t >= c.at) landStep(rd, c);
    });

    // —— AI 单位得分漂移（各队处置水平不一） ——
    if (st.t >= st.nextUnitAt) {
      st.units.forEach(function (u) { u.score += 120 + r(280) + (Math.random() < 0.12 ? 300 + r(400) : 0) - (Math.random() < 0.1 ? 200 : 0); });
      st.nextUnitAt = st.t + Math.floor(DAY_LEN * 0.8) + r(20);
      board();
    }

    // —— 裁判群播报 ——
    if (Math.random() < 0.012) feed(pick(D.FEED.referee));
    if (Math.random() < 0.008) feed(pick(Math.random() < 0.6 ? D.FEED.bluewins : D.FEED.redwins));

    // —— 影子资产夜袭（战前没摸清的代价） ——
    if (st.fx.shadow > 0 && secInDay > DAY_LEN * 0.8 && Math.random() < 0.006 * st.fx.shadow) {
      shadowLost();
    }

    meters();
    if (secInDay === 0 && st.t > 0) dayEnd();          // 无人区：t 达 DAY_LEN 整数倍
  }

  /* ---------- 战役步骤 ---------- */
  function startStep(rd, c) {
    var cls = c.steps[c.idx];
    var tpl;
    if (cls === 'zeroday') tpl = D.ALERTS.filter(function (a) { return a.cls === 'exploit'; })[3];
    else if (cls === 'phish0') tpl = D.ALERTS.filter(function (a) { return a.cls === 'phish'; })[1];
    else if (cls === 'phish1') tpl = D.ALERTS.filter(function (a) { return a.cls === 'phish'; })[0];
    else tpl = pick(D.ALERTS.filter(function (a) { return a.cls === cls; }));
    if (!tpl) { c.idx++; return; }
    var ctx = { ip: rd.ip, host: pick(['WEB-01', 'OA-01', 'APP-02', 'FILE-03', 'VPN-01', 'DEV-02']), user: pick(['zhangwei', 'lisi', 'hr02', 'ops01', 'wangfang', 'fin03']), dom: pick(['evil-cdn.net', 'update-svc.xyz', 'paste-log.icu']), n: r(200) };
    var info = tpl.gen(ctx);
    info.cls = cls; info.kind = tpl.kind; info.sev = tpl.sev; info.sc = tpl.sc;
    info.srcIp = rd.ip; info.real = true; info.team = rd.alias; info.wl = false;
    // 战前效果干预
    if (cls === 'brute' && st.fx.weak === 2) return campaignFail(rd, '爆破被双因子挡住，无收获');
    if (cls === 'brute' && st.fx.weak === 1 && Math.random() < 0.5) return campaignFail(rd, '管理账号已加固，爆破无收获');
    if (cls === 'exploit' && Math.random() < (st.fx.patch || 0)) return campaignFail(rd, 'Nday 已修复/虚拟补丁生效，利用失败');
    if (cls === 'phish1' && Math.random() > (st.fx.phish / 0.3)) return campaignFail(rd, '钓鱼无人点击（演练起效）');
    // 蜜罐捕获
    if (!c.hitHoney && st.honey > 0 && Math.random() < (st.honey === 2 ? 0.4 : 0.15)) {
      c.hitHoney = true;
      captureClue(rd);
    }
    var aid = ++st.aid;
    var alert = {
      id: aid, cls: info.cls, kind: info.kind, sev: info.sev, sc: info.sc,
      title: info.title, log: info.log, asset: info.asset, teach: info.teach,
      srcIp: rd.ip, real: true, wl: false, team: rd.alias, host: info.kind === 'host',
      born: nowStr(), handled: false, reported: false, until: st.t + Math.round((16 + r(14)) * (0.5 + (st.fx.drill || 1) * 0.5) / rd.skill),
    };
    c.alertId = aid; c.waiting = true; c.at = alert.until;
    st.alerts.unshift(alert);
    writeLog(logFileFor(info.cls), '[' + alert.born + '] ' + info.log + '  (src=' + rd.ip + ', team_sig=' + sigOf(rd) + ')');
    if (st.fx.log >= 1 && (info.cls === 'lateral' || info.cls === 'dc' || info.cls === 'exfil')) {
      writeLog('ndr.log', '[' + alert.born + '] 内网会话: ' + info.asset + ' <- ' + ctx.host + ' (关联外联 ' + rd.ip + ')');
    }
    renderAlerts();
    $('#hbAlertTitle').textContent = '⚠ ' + alert.title;
  }
  function sigOf(rd) { return 'JA3=a' + (rd.id.charCodeAt(0) % 9) + 'f' + rd.id.charCodeAt(1) % 7 + 'c'; }
  function logFileFor(cls) {
    return ({ recon: 'ids.log', brute: 'vpn.log', exploit: 'waf.log', zeroday: 'waf.log', webshell: 'edr.log', phish: 'mailgw.log', supply: 'edr.log', lateral: 'ndr.log', dc: 'edr.log', exfil: 'fw.log' })[cls] || 'fw.log';
  }
  function landStep(rd, c) {
    c.waiting = false;
    var cls = c.steps[c.idx];
    // 该步告警未被处置 → 推进
    var al = st.alerts.find(function (a) { return a.id === c.alertId; });
    if (al && !al.handled) { al.missed = true; st.stats.missed++; }
    st.alerts = st.alerts.filter(function (a) { return a.id !== c.alertId; });
    c.idx++;
    var last = c.steps[c.idx - 1];
    if (c.idx >= c.steps.length || last === 'exfil') {
      campaignDamage(rd, last);
      rd.camp = null;
      renderAlerts();
      return;
    }
    c.at = st.t + 2 + r(4);
    renderAlerts();
  }
  function campaignDamage(rd, lastCls) {
    if (lastCls === 'exfil') {
      var t = st.targets.main ? 'main' : (st.targets.oa ? 'oa' : (st.targets.db ? 'db' : null));
      if (t) {
        var cost = t === 'main' ? 5000 : 3000;
        st.targets[t] = 0; st.lost++;
        st.stats.targetLost++; st.score -= cost; rd.score += cost;
        feed('🔴 <b>' + targetName(t) + '失陷</b>——' + rd.alias + ' 提交成果并获裁判认证：<b>- ' + cost + '</b>' + (t === 'main' ? '（按规取消排名资格，此处仅教学复盘）' : ''), 'var(--ro)');
        termPrint('💀 [仲裁] ' + rd.alias + ' 拿下' + targetName(t) + '！复盘：链路上至少有 3 次告警未处置，' + (t === 'main' ? '主靶标失陷的单位将不参加排名。' : '分靶标失陷 -' + cost + '。'), 't-r');
        if (window.App && App.toast) App.toast('靶标失陷 -' + cost, '🔴');
      } else { assetDamage(rd); }
    } else {
      assetDamage(rd);
    }
    board();
  }
  function assetDamage(rd) {
    st.lost++; st.stats.assetLost++;
    st.score -= 200; rd.score += 200;
    var h = pick(['WEB-01', 'OA-01', 'APP-02', 'FILE-03']);
    feed('🔴 普通资产失陷（' + h + ' 服务器权限）——' + rd.alias + ' 提交成果：<b>-200</b>', 'var(--ro)');
    writeLog('edr.log', '[' + nowStr() + '] [通报] ' + h + ' 失陷确认 (attacker=' + rd.ip + ')');
  }
  function shadowLost() {
    st.fx.shadow--; st.lost++; st.stats.assetLost++;
    st.score -= 200;
    feed('🟠 <b>影子资产失陷</b>：战前未摸清的主机被红队当跳板 -200（资产测绘的教训）', 'var(--ro)');
  }
  function campaignFail(rd, why) {
    rd.camp = null;
    feed('🟢 ' + rd.alias + ' 行动失败：' + why, 'var(--li)');
    termPrint('🟢 [战报] ' + rd.alias + ' 今日行动失败——' + why + '。（战前加固正在生效）', 't-g');
  }
  function cutCampaign(rd, how, gained) {
    if (rd.camp) {
      var al = st.alerts.find(function (a) { return a.id === rd.camp.alertId; });
      if (al) { al.handled = true; st.alerts = st.alerts.filter(function (a) { return a.id !== al.id; }); }
      rd.camp = null;
    }
    feed('🟢 你方' + how + ' ' + rd.alias + ' 的攻击链' + (gained ? '，<b>+' + gained + '</b>' : ''), 'var(--li)');
  }

  /* ---------- 蜜罐 / 溯源证据 ---------- */
  function captureClue(rd) {
    var person = pick(['SkyWalker', 'Night_Cr0w', 'wolf_0x7f', 'GhostShell', 'predator_z', 'Bl4ckHat']) + '_' + (100 + r(899));
    var clue = { team: rd.alias, person: person, token: 'SAMPLE-' + (1000 + r(9000)), tool: pick(['冰蝎 4.0', '哥斯拉', 'Cobalt Strike 4.9', 'fscan', 'Nimplant']), at: nowStr() };
    st.clues.push(clue);
    writeLog('honey.log', '[' + clue.at + '] 蜜罐捕获！' + clue.tool + ' 回连蜜罐，样本 ' + clue.token + ' 落盘；诱导读取攻击者本地 PFRO.log → 微信 ID "' + clue.person + '"（关联 ' + rd.ip + '）');
    feed('🍯 <b>蜜罐捕获</b>：' + rd.alias + ' 触碰蜜罐，样本已落盘（trace 样本编号可溯源到人）', 'var(--am)');
    termPrint('🍯 [蜜罐] 捕获 ' + rd.alias + '：' + clue.tool + ' 上钩，样本 ' + clue.token + '。hint：cat /hw/honey.log 查看，trace ' + clue.token + ' 溯源到人。', 't-w');
  }

  /* ============================================================
     告警 UI 与玩家动作
     ============================================================ */
  function emit(tpl) {
    var ctx = { ip: pick(['66.249.66.1', '220.181.108.92', '157.55.39.9', '10.1.8.35', '10.1.9.9']), host: 'WEB-01', user: 'ops01', dom: 'cdn.jsdelivr.net', n: r(200) };
    var info = tpl.gen(ctx);
    st.alerts.unshift({ id: ++st.aid, cls: tpl.cls, kind: tpl.kind, sev: tpl.sev, sc: 0, title: info.title, log: info.log, asset: info.asset, teach: info.teach, srcIp: ctx.ip, real: false, wl: tpl.cls === 'partner', host: false, born: nowStr(), handled: false, reported: false, until: st.t + 22 + r(15) });
    st.alerts = st.alerts.slice(0, 9);
    renderAlerts();
  }
  function emitPartner() {
    var tpl = D.PARTNER_ALERT;
    var ip = D.PARTNER.seg + r(255);
    var info = tpl.gen({ ip: ip });
    st.alerts.unshift({ id: ++st.aid, cls: 'partner', kind: 'none', sev: 1, sc: 0, title: info.title, log: info.log, asset: info.asset, teach: info.teach, srcIp: ip, real: false, wl: true, host: false, born: nowStr(), handled: false, reported: false, until: st.t + 26 + r(14) });
    st.alerts = st.alerts.slice(0, 9);
    renderAlerts();
  }
  function emitIntel() {
    var tpl = D.ALERTS.filter(function (a) { return a.cls === 'phish'; })[2];
    var info = tpl.gen({ ip: 'intel.local', host: '—', user: '—', dom: 'github.com', n: 0 });
    st.alerts.unshift({ id: ++st.aid, cls: 'phish', kind: 'none', sev: tpl.sev, sc: tpl.sc, title: info.title, log: info.log, asset: info.asset, teach: info.teach, srcIp: '—', real: true, wl: false, host: false, team: null, born: nowStr(), handled: false, reported: false, until: st.t + 30 + r(15) });
    st.alerts = st.alerts.slice(0, 9);
    renderAlerts();
  }
  function sevColor(sev) { return sev >= 3 ? 'var(--ro)' : sev === 2 ? 'var(--am)' : 'var(--tx2)'; }
  function renderAlerts() {
    var q = st.alerts;
    $('#hbQueueInfo').textContent = '队列 ' + q.length + ' 条';
    if (!q.length) { $('#hwAlerts').innerHTML = '<div style="color:var(--tx3);font-size:12.5px;padding:18px;text-align:center">告警队列空闲中……红队随时会来。</div>'; return; }
    $('#hwAlerts').innerHTML = q.map(function (a) {
      var miss = a.missed;
      var diffLine = '';
      if (window.DIFF && !miss) {
        if (DIFF.showAnswer('hwv')) {
          diffLine = a.real
            ? '<div style="font-size:11.5px;color:var(--li)">✅ 新手模式建议：上报裁判' + (a.kind === 'host' ? ' + 隔离 ' + esc(a.asset) : (a.kind === 'ban' ? ' + 封禁源IP' : '')) + '</div>'
            : '<div style="font-size:11.5px;color:var(--li)">✅ 新手模式建议：' + (a.wl ? '白名单放行——千万别封' : '忽略（正常业务/噪音）') + '</div>';
        } else if (DIFF.showHint('hwv') && a.real) {
          diffLine = '<div style="font-size:11.5px;color:var(--am)">💡 提示：' + esc(a.teach) + '</div>';
        }
      }
      return '<div class="alert-card" data-id="' + a.id + '" style="border:1px solid ' + (a.real ? 'rgba(224,60,50,.45)' : 'var(--line)') + ';background:rgba(10,16,32,.55);border-radius:10px;padding:10px 12px;' + (miss ? 'opacity:.55' : '') + '">' +
        '<div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">' +
        '<b style="font-size:13px;color:' + sevColor(a.sev) + '">' + (a.real ? '🔴' : a.wl ? '🤝' : '⚪') + ' ' + esc(a.title) + '</b>' +
        '<span style="margin-left:auto;font-size:11px;color:var(--tx3);font-family:var(--m)">' + a.born + ' · src ' + esc(a.srcIp) + '</span></div>' +
        '<div style="font-size:12px;color:var(--tx2);font-family:var(--m);margin:4px 0 8px;word-break:break-all">' + esc(a.log) + '</div>' +
        diffLine +
        (miss ? '<span style="font-size:11.5px;color:var(--ro)">⚠ 已错过处置窗口（计入漏报）</span>' :
          '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="btn btn-sm btn-primary act" data-act="report" style="padding:4px 12px;font-size:11.5px">上报裁判</button>' +
          '<button class="btn btn-sm btn-ghost act" data-act="ban" style="padding:4px 12px;font-size:11.5px">封禁源IP</button>' +
          (a.host ? '<button class="btn btn-sm btn-ghost act" data-act="isolate" style="padding:4px 12px;font-size:11.5px">隔离 ' + esc(a.asset) + '</button>' : '') +
          '<button class="btn btn-sm btn-ghost act" data-act="ignore" style="padding:4px 12px;font-size:11.5px">忽略</button>' +
          '</div>') +
        '</div>';
    }).join('');
    document.querySelectorAll('#hwAlerts .act').forEach(function (b) {
      b.onclick = function () {
        var id = +b.closest('.alert-card').dataset.id;
        act(+b.dataset.act === 'report' ? 'report' : b.dataset.act, id);
      };
    });
  }
  function act(kind, id) {
    if (!st || st.phase !== 'battle') return;
    var a = st.alerts.find(function (x) { return x.id === id; });
    if (!a) return;
    if (kind === 'report') {
      if (a.real) {
        a.reported = true; a.handled = true;
        st.stats.reported++;
        st.score += 200;
        feed('🟦 研判上报：' + a.title + ' → 裁判确认（攻击队提交成果前发现上报）<b>免于扣分 +200</b>', 'var(--li)');
        termPrint('🟦 [仲裁·通过] 上报单 9 要素齐全（时间到秒/源目IP/资产/定性/临时措施），裁判确认 ' + a.title + ' +200，免扣 ' + (a.sc >= 5 ? 200 : 100) + '~300。' + a.teach, 't-g');
        if (a.team) cutCampaign(st.reds.find(function (x) { return x.alias === a.team; }), '研判上报阻断', 0);
      } else {
        st.stats.falseReport++; st.score -= 100;
        feed('🟡 研判上报：' + a.title + ' → 裁判<b>驳回（误报）</b> -100', 'var(--am)');
        termPrint('🟡 [仲裁·驳回] 误报上报 -100。' + a.teach, 't-w');
      }
    } else if (kind === 'ban') {
      if (a.wl || (!a.real && (a.cls === 'partner' || a.title.includes('爬虫')))) {
        st.stats.falseBan++; st.score -= 100;
        feed('🟠 封禁 ' + a.srcIp + ' → <b>误封白名单/正常流量</b> -100（' + (a.wl ? D.PARTNER.note : '正常业务') + '）', 'var(--ro)');
        termPrint('🟠 [处置·误封] -100。真实护网里误封会被判"非正常防守"；先研判再封，白名单放行。' + a.teach, 't-r');
      } else if (a.real) {
        st.stats.blocked++; st.score += 100;
        st.bans.push({ ip: a.srcIp, day: st.day });
        termPrint('🟢 [处置] 封禁攻击源 ' + a.srcIp + ' +100（应急处置·阻断），该源后续流量已 DENY。' + a.teach, 't-g');
        cutCampaign(st.reds.find(function (x) { return x.alias === a.team; }), '封禁攻击源', 100);
      } else {
        feed('⚪ 已封禁 ' + a.srcIp + '（无实质影响，未计分）', 'var(--tx3)');
        termPrint('⚪ [处置] 封禁完成，但该源本就是正常流量——研判要先定性。', 't-c');
      }
    } else if (kind === 'isolate') {
      if (a.real && a.host) {
        st.stats.isolated++; st.score += 200;
        termPrint('🟢 [处置] ' + a.asset + ' 网络隔离（保留内存与日志取证）+200，横向链路切断。' + a.teach, 't-g');
        cutCampaign(st.reds.find(function (x) { return x.alias === a.team; }), '隔离失陷主机', 200);
      } else {
        feed('⚪ 已隔离 ' + a.asset + '（复查无异常，已解除）', 'var(--tx3)');
        termPrint('⚪ [处置] 隔离复查无异常——对非失陷主机动手前，先确认证据。', 't-c');
      }
    } else if (kind === 'ignore') {
      if (a.real && !a.handled) { st.stats.missed++; a.missed = true; }
      st.alerts = st.alerts.filter(function (x) { return x.id !== id; });
      renderAlerts();
      return;
    }
    st.alerts = st.alerts.filter(function (x) { return x.id !== id; });
    meters(); board();
    renderAlerts();
  }
  function targetName(t) { return t === 'main' ? '主靶标·业务系统' : t === 'oa' ? '分靶标·OA' : '分靶标·数据库'; }

  /* ============================================================
     取证终端
     ============================================================ */
  function scrollBottom() { box.scrollTop = box.scrollHeight; }
  function termPrint(t, cls) {
    var div = document.createElement('div');
    div.className = 'ln ' + (cls || 't-c');
    div.textContent = t;
    box.insertBefore(div, inputLine);
    scrollBottom();
  }
  function writeLog(file, line) {
    if (!st.files['/hw/' + file]) st.files['/hw/' + file] = [];
    var f = st.files['/hw/' + file];
    f.push(line);
    if (f.length > 220) f.splice(0, f.length - 220);
  }
  function findFile(arg) {
    if (st.files[arg] != null) return st.files[arg];
    var base = arg.split('/').pop();
    var keys = Object.keys(st.files);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].split('/').pop() === base || keys[i].includes(base) || base.includes(keys[i].split('/').pop())) return st.files[keys[i]];
    }
    return undefined;
  }
  function stageRun(cmd, args, stdin) {
    if (cmd === 'history') return { lines: st.history.slice().reverse().map(function (h, i) { return '  ' + (i + 1) + '  ' + h; }) };
    var src = stdin;
    if (src == null) {
      var nonOpt = args.filter(function (x) { return x.charAt(0) !== '-'; });
      if (!nonOpt.length) return { error: cmd + ': 缺少输入' };
      var found = findFile(nonOpt[nonOpt.length - 1]);
      if (found == null) return { error: cmd + ': ' + nonOpt[nonOpt.length - 1] + ': 没有那个文件（ls /hw 查看）' };
      src = found.slice();
    }
    if (cmd === 'cat' || cmd === 'type') return { lines: src };
    if (cmd === 'grep') {
      var ig = args.includes('-i'), cnt = args.includes('-c'), invv = args.includes('-v'), ex = args.includes('-E');
      var nonOpt = args.filter(function (x) { return x.charAt(0) !== '-'; });
      if (!nonOpt.length) return { error: 'grep: 用法 grep <模式> <文件>' };
      var pat = nonOpt[0].replace(/^['"]|['"]$/g, '');
      var re; try { re = new RegExp(ex ? pat : pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ig ? 'i' : ''); } catch (e) { return { error: 'grep: 无效模式' }; }
      var out = src.filter(function (l) { return invv ? !re.test(l) : re.test(l); });
      return { lines: cnt ? [String(out.length)] : out };
    }
    if (cmd === 'awk') {
      var prog = args.find(function (x) { return x.includes('print'); });
      if (!prog) return { error: 'awk: 仅支持 {print $N}' };
      var mAll = prog.match(/\$(\d+|NF)/g); var fields = mAll ? mAll.map(function (m) { return m.slice(1); }) : ['0'];
      return { lines: src.map(function (l) { var p = l.trim().split(/\s+/); return p[0] ? fields.map(function (f) { return f === 'NF' ? String(p.length) : (p[+f - 1] || ''); }).join(' ') : ''; }) };
    }
    if (cmd === 'head' || cmd === 'tail') {
      var n = 10, ni = args.indexOf('-n');
      if (ni > -1 && args[ni + 1]) n = +args[ni + 1];
      return { lines: cmd === 'head' ? src.slice(0, n) : src.slice(-n) };
    }
    if (cmd === 'wc') return { lines: [String(src.length)] };
    if (cmd === 'sort') { var arr = src.slice(); arr.sort(); if (args.includes('-r')) arr.reverse(); return { lines: arr }; }
    if (cmd === 'uniq') { var out2 = [], prev = null; src.forEach(function (l) { if (l !== prev) out2.push(l); prev = l; }); return { lines: out2 }; }
    return { error: cmd + ': 命令未实现' };
  }
  function execStage(tokens, stdin) {
    var cmd = tokens[0], args = tokens.slice(1);
    if (cmd === 'ls') return { lines: Object.keys(st.files).sort() };
    if (cmd === 'find') return { lines: Object.keys(st.files).sort() };
    if (cmd === 'pwd') return { lines: ['/hw'] };
    if (['cat', 'type', 'grep', 'awk', 'head', 'tail', 'wc', 'sort', 'uniq', 'history'].includes(cmd)) return stageRun(cmd, args, stdin);
    return { error: 'bash: ' + cmd + ': command not found（help 查看手册）' };
  }
  function parseLine(line) { var t = line.match(/'[^']*'|"[^"]*"|\S+/g) || []; return t.map(function (x) { return x.replace(/^['"]|['"]$/g, ''); }); }
  function runPipeline(tokens) {
    var stdin = null, rest = tokens;
    while (rest.length) {
      var i = rest.indexOf('|');
      var seg = i === -1 ? rest : rest.slice(0, i);
      if (seg.length) {
        var res = execStage(seg, stdin);
        if (res.error) { termPrint(res.error, 't-r'); return; }
        if (i === -1) { (res.lines || []).forEach(function (l) { termPrint(l); }); return; }
        stdin = res.lines;
      }
      if (i === -1) return;
      rest = rest.slice(i + 1);
    }
  }
  function doTrace(arg) {
    if (!arg) { termPrint('用法：trace <攻击IP> 或 trace <样本编号/人名>（log>=1 时也可 trace 队名）', 't-w'); return; }
    // 1) 溯源到人（蜜罐样本）
    var clue = st.clues.find(function (c) { return argMatch(arg, c.person) || argMatch(arg, c.token); });
    if (clue && !clue.traced) {
      clue.traced = true;              // 溯源到人只计一次，但样本仍可用于反制
      st.stats.traced++; st.score += 800;
      termPrint('🎯 [溯源到人 +800] 样本 ' + clue.token + ' → 攻击者本地 PFRO.log → 微信 ID "' + clue.person + '" → 社交平台定位 → 确认 ' + clue.team + ' 攻击队成员真实身份。裁判已认证（追踪溯源·虚拟身份）', 't-g');
      feed('🟦 <b>溯源到人！</b>蜜罐样本锁定 ' + clue.team + '·' + clue.person + ' 真实身份 <b>+800</b>', 'var(--li)');
      renderAlerts();
      return;
    }
    // 2) 溯源到队
    var team = st.reds.find(function (x) { return argMatch(arg, x.alias); });
    if (team && (st.fx.log >= 1) && (st.stats.blocked + st.stats.reported > 0)) {
      st.stats.traced++; st.score += 300;
      termPrint('🎯 [溯源到队 +300] 通过手法链与基础设施关联 → 锁定 <b>' + team.name + '</b>（' + pick(team.styles) + ' 专精）。真实护网中其每个跳板被溯源 -500。', 't-g');
      feed('🟦 你方<b>溯源到攻击队</b>：' + team.name + ' +300', 'var(--li)');
      return;
    }
    // 3) 溯源到 IP
    var ipHit = Object.keys(st.files).some(function (k) { return st.files[k].some(function (l) { return l.includes(arg); }); });
    if (ipHit) {
      st.stats.traced++; st.score += 100;
      termPrint('🎯 [溯源到IP +100] 日志交叉定位：' + arg + ' 的会话链已还原。' + (st.fx.log >= 1 ? '结合手法特征可继续 trace <队名>。' : '日志分散（战前未集中），无法继续深挖——这是 log=0 的代价。'), 't-g');
      feed('🟦 你方溯源攻击 IP +100', 'var(--li)');
      return;
    }
    termPrint('❌ [溯源] 证据不足：' + arg + ' 未在日志中发现。多查 /hw/ 日志（log 采集等级 ' + st.fx.log + '），或等蜜罐捕获样本。', 't-r');
  }
  function doCounter() {
    var clue = st.clues.find(function (c) { return !c.used; });
    if (!clue) { termPrint('counter: 没有可用反制线索——先部署蜜罐（战前决策），等红队触碰后 trace 样本。', 't-w'); return; }
    clue.used = true;
    st.stats.countered++; st.counters++;
    st.score += 1000;
    var rd = st.reds.find(function (x) { return x.alias === clue.team; });
    if (rd) { rd.disableDay = st.day + 1; rd.score = Math.max(0, rd.score - 500); }
    termPrint('⚔️ [反制 +1000] 依据样本 ' + clue.token + ' 固定证据并处置其跳板 → ' + (rd ? rd.alias : clue.team) + ' <b>失去进攻能力 1 天</b>（其被溯源跳板 -500）。注意：真实护网反打须授权，越权反制会取消资格。', 't-g');
    feed('🟦 <b>你方成功反制</b>：' + (rd ? rd.alias : clue.team) + ' 跳板被处置 <b>+1000</b>，该队停摆 1 天', 'var(--li)');
  }
  function argMatch(a, k) { var u = String(a).toLowerCase().trim(), w = String(k).toLowerCase().trim(); return u === w || u.includes(w) || w.includes(u); }
  function showHelp() {
    [
      '════════ 护网值守手册 ════════',
      '🔔 告警处置（左侧队列）：上报裁判（真实攻击得分/误报扣分）· 封禁源IP（误封白名单扣分）· 隔离主机（切断横向）',
      '🔍 取证：ls /hw · cat fw.log · grep <模式> <文件> · awk \'{print $N}\'（支持 | 管道）',
      '🎯 溯源：trace <攻击IP> +3 → trace <队名> +8 → trace <样本编号/人名> +15',
      '⚔️ 反制：counter（需蜜罐线索）+20，并使该攻击队停摆 1 天',
      '🍯 蜜罐：honey 查看捕获状态（战前部署高交互蜜罐捕获率最高）',
      '⚙️ 其他：status 战况 · save 存档 · clear 清屏',
    ].forEach(function (l) { termPrint(l, 't-i'); });
  }
  function run(raw) {
    var cmd = raw.trim();
    if (!cmd) return;
    st.history.unshift(cmd); if (st.history.length > 60) st.history.pop();
    termPrint('blue@hw:~$ ' + cmd, 't-p');
    var tokens = parseLine(cmd);
    var head = (tokens[0] || '').toLowerCase(), arg = tokens.slice(1).join(' ');
    if (head === 'help') return showHelp();
    if (head === 'clear') { box.querySelectorAll('.ln:not(.ln-in)').forEach(function (el) { el.remove(); }); return; }
    if (head === 'trace') return doTrace(arg);
    if (head === 'counter') return doCounter();
    if (head === 'honey') {
      if (!st.honey) return termPrint('蜜罐：未部署（战前决策的代价——没有诱捕就没有反制抓手）', 't-r');
      termPrint('蜜罐：' + (st.honey === 2 ? '高交互' : '低交互') + ' · 已捕获线索 ' + st.clues.filter(function (c) { return !c.used; }).length + ' 条', 't-c');
      st.clues.forEach(function (c) { termPrint((c.used ? '·已用 ' : '·可用 ') + c.token + ' ' + c.tool + ' 人员ID:' + c.person + ' @' + c.at, c.used ? 't-c' : 't-w'); });
      if (!st.clues.length) termPrint('（红队尚未触碰蜜罐，等他们踩进来……）', 't-c');
      return;
    }
    if (head === 'status') {
      var rank = rankOf();
      return termPrint('D' + st.day + '/' + st.days + ' · 我方 ' + st.score + ' 分 · 排名 #' + rank + '/20 · 靶标 ' + (st.targets.main + st.targets.oa + st.targets.db) + '/3 · 失陷 ' + st.lost + ' · 红队最高 ' + Math.max.apply(null, st.reds.map(function (x) { return x.score; })) + ' 分', 't-w');
    }
    if (head === 'save') { saveMatch(); return termPrint('💾 已存档，关闭页面后可继续本次演练。', 't-w'); }
    var before = box.querySelectorAll('.ln').length;
    runPipeline(tokens);
    if (box.querySelectorAll('.ln').length === before) termPrint('（无输出）', 't-w');
  }

  /* ============================================================
     面板 / 排名
     ============================================================ */
  function rankOf() {
    var rows = st.units.map(function (u) { return { name: u.name, score: u.score, me: false }; });
    rows.push({ name: '我方单位', score: st.score, me: true });
    rows.sort(function (a, b) { return b.score - a.score; });
    return rows.findIndex(function (x) { return x.me; }) + 1;
  }
  function board() {
    var rows = st.units.map(function (u) { return { name: u.name, score: u.score, me: false }; });
    rows.push({ name: '我方单位（你）', score: st.score, me: true });
    rows.sort(function (a, b) { return b.score - a.score; });
    var html = '';
    rows.slice(0, 10).forEach(function (x, i) {
      html += '<div class="lb-row' + (x.me ? ' me' : '') + '"><span class="lb-rank">' + (i + 1) + '</span><span class="lb-name">' + esc(x.name) + '</span><span class="lb-score">' + x.score + '</span></div>';
    });
    var mine = rows.findIndex(function (x) { return x.me; });
    if (mine >= 10) html += '<div class="lb-row me"><span class="lb-rank">' + (mine + 1) + '</span><span class="lb-name">我方单位（你）</span><span class="lb-score">' + st.score + '</span></div>';
    $('#hbBoard').innerHTML = html;
  }
  function meters() {
    $('#hbDay').textContent = 'D' + st.day;
    $('#hbScore').textContent = st.score;
    $('#hbRank').textContent = '#' + rankOf();
    $('#hbTarget').textContent = (st.targets.main + st.targets.oa + st.targets.db) + '/3';
    $('#hbLost').textContent = st.lost;
    $('#hbRed').textContent = Math.max.apply(null, st.reds.map(function (x) { return x.score; }));
    $('#hbIntel').textContent = 'log 等级 ' + st.fx.log + ' · 蜜罐线索 ' + st.clues.filter(function (c) { return !c.used; }).length;
  }
  function feed(html, color) {
    var el = document.createElement('div');
    el.className = 'feed-item new';
    if (color) el.style.color = color;
    el.innerHTML = html;
    var fd = $('#hwFeed');
    fd.prepend(el);
    while (fd.children.length > 60) fd.lastChild.remove();
  }

  /* ============================================================
     每日战报 / 结算
     ============================================================ */
  function dayEnd() {
    st.phase = 'daily';
    if (timer) { clearInterval(timer); timer = null; }
    // 影子资产清查提醒
    var todayRank = rankOf();
    var redTop = st.reds.slice().sort(function (a, b) { return b.score - a.score; })[0];
    var rep = $('#hwReport');
    rep.style.display = '';
    var d1 = st.day < st.days;
    rep.innerHTML =
      '<div class="card" style="max-width:640px;margin:0 auto;padding:26px 28px;text-align:center">' +
      '<h3 style="font-size:19px;font-weight:800">📰 D' + st.day + ' 每日战报</h3>' +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:14px 0">' +
      '<span class="tag cy">我方得分 <b>' + st.score + '</b></span>' +
      '<span class="tag">排名 <b>#' + todayRank + '</b>/20</span>' +
      '<span class="tag" style="color:var(--ro)">红队最高 <b>' + redTop.score + '</b>（' + redTop.name + '）</span>' +
      '<span class="tag">靶标 <b>' + (st.targets.main + st.targets.oa + st.targets.db) + '/3</b></span>' +
      '</div>' +
      '<div style="font-size:12.5px;color:var(--tx2);line-height:2;text-align:left;max-width:520px;margin:0 auto">' +
      '上报通过 ' + st.stats.reported + ' · 误报驳回 ' + st.stats.falseReport + ' · 封禁阻断 ' + st.stats.blocked + ' · 误封 ' + st.stats.falseBan + '<br>' +
      '隔离处置 ' + st.stats.isolated + ' · 漏报 ' + st.stats.missed + ' · 溯源 ' + st.stats.traced + ' · 反制 ' + st.stats.countered + '<br>' +
      '<span style="color:var(--tx3)">' + (d1 ? '提示：红队明日将更换攻击源 IP——昨天的封禁名单对他们失效。' : '') + '</span></div>' +
      '<button class="btn btn-primary" id="nextDayBtn" style="margin-top:16px">' + (d1 ? '☀️ 进入 D' + (st.day + 1) + ' 值守' : '🏁 演练结束，查看总评') + '</button>' +
      '</div>';
    $('#nextDayBtn').onclick = function () {
      rep.style.display = 'none';
      if (st.day >= st.days) return endMatch();
      st.day++;
      st.phase = 'battle';
      dayStart(false);
      if (timer) clearInterval(timer);
      timer = setInterval(tick, 1000);
    };
    saveMatch();
  }
  function endMatch() {
    st.over = true;
    if (timer) { clearInterval(timer); timer = null; }
    localStorage.removeItem(SAVE_KEY);
    var rank = rankOf();
    var win = rank <= 5;
    if (window.Progress && Progress.recordGame) Progress.recordGame('hwv', win ? 'W' : 'L');
    var xp = 30 + st.stats.reported * 2 + st.stats.traced * 3 + st.stats.countered * 10;
    if (window.Progress && Progress.addXP) Progress.addXP(xp, '护网演练结算');
    var grade = rank <= 3 ? 'S · 标杆防守单位' : rank <= 8 ? 'A · 优秀防守单位' : rank <= 14 ? 'B · 合格' : 'C · 需要复盘';
    var best = +(localStorage.getItem('hwv_best') || 0);
    if (st.score > best) { best = st.score; localStorage.setItem('hwv_best', best); }
    var cnt = +(localStorage.getItem('hwv_count') || 0) + 1;
    localStorage.setItem('hwv_count', cnt);
    localStorage.setItem('hwv_lastRank', rank);
    var rep = $('#hwReport');
    $('#hwBattle').style.display = 'none';
    rep.style.display = '';
    rep.innerHTML =
      '<div class="card" style="max-width:720px;margin:0 auto;padding:30px">' +
      '<h3 style="font-size:22px;font-weight:800;text-align:center">' + (win ? '🏆 演练收官' : '🛡️ 演练收官') + ' · 综合评级 ' + grade + '</h3>' +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:16px 0">' +
      '<span class="tag cy">最终排名 <b>#' + rank + '</b>/20</span>' +
      '<span class="tag">总得分 <b>' + st.score + '</b></span>' +
      '<span class="tag">靶标 <b>' + (st.targets.main + st.targets.oa + st.targets.db) + '/3</b></span>' +
      '<span class="tag" style="color:var(--am)">+' + xp + ' XP</span>' +
      '<span class="tag">历史最佳 <b>' + best + '</b> · 参赛 ' + cnt + ' 次</span></div>' +
      '<h4 style="font-size:14px;font-weight:800;margin:8px 0">📊 值守复盘</h4>' +
      '<div style="font-size:12.5px;color:var(--tx2);line-height:2.1">' +
      '研判上报通过 ' + st.stats.reported + ' 次（+分主项）· 误报被驳回 ' + st.stats.falseReport + ' 次<br>' +
      '封禁阻断 ' + st.stats.blocked + ' · 误封白名单 ' + st.stats.falseBan + ' · 隔离失陷主机 ' + st.stats.isolated + '<br>' +
      '漏报（错过处置窗口）' + st.stats.missed + ' · 资产失陷 ' + st.stats.assetLost + ' · 靶标失陷 ' + st.stats.targetLost + '<br>' +
      '溯源到 IP/队/人 ' + st.stats.traced + ' 次 · 蜜罐反制 ' + st.stats.countered + ' 次<br>' +
      '<span style="color:var(--tx3)">真实护网里：研判上报是基本盘，蜜罐+溯源反制是拉开差距的高分项，而漏报和靶标失陷是最重的扣分项。</span></div>' +
      '<div style="text-align:center;margin-top:16px"><button class="btn btn-primary" onclick="location.reload()">再来一局</button> <a class="btn btn-ghost" href="index.html">返回首页</a></div>' +
      '</div>';
    if (win && window.App && App.confetti) App.confetti(90);
    ratingTags();
  }

  /* ============================================================
     存档
     ============================================================ */
  function saveMatch() {
    if (!st || st.over || st.phase === 'prep') return;
    var data = JSON.parse(JSON.stringify({
      v: 1, phase: 'battle', days: st.days, day: st.day, t: st.t, score: st.score,
      targets: st.targets, lost: st.lost, bans: st.bans, alerts: st.alerts, aid: st.aid,
      reds: st.reds, units: st.units, honey: st.honey, clues: st.clues, fx: st.fx,
      files: st.files, stats: st.stats, history: st.history.slice(0, 20),
      nextNoiseAt: st.nextNoiseAt, nextPartnerAt: st.nextPartnerAt, nextUnitAt: st.nextUnitAt,
      zeroday: st.zeroday, savedAt: Date.now(),
    }));
    data.fx.__days = st.days;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {}
  }
  function loadSave() {
    var raw;
    try { raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { raw = null; }
    if (!raw || raw.v !== 1 || raw.day > raw.days) { localStorage.removeItem(SAVE_KEY); return false; }
    var days = raw.fx && raw.fx.__days ? raw.fx.__days : raw.days;
    startBattle(raw);
    feed('💾 已恢复演练存档：D' + st.day + '，得分 <b>' + st.score + '</b>', 'var(--am)');
    return true;
  }

  /* ============================================================
     初始化
     ============================================================ */
  function ratingTags() {
    var best = localStorage.getItem('hwv_best'), cnt = +(localStorage.getItem('hwv_count') || 0), lr = localStorage.getItem('hwv_lastRank');
    $('#hwBest').textContent = best === null ? '—' : best;
    $('#hwRecTag').textContent = '参赛 ' + cnt + ' 次';
    $('#hwRankTag').textContent = lr === null ? '历史评级：未参赛' : '上次评级：#' + lr + '/20';
  }
  document.addEventListener('DOMContentLoaded', function () {
    box = $('#hwTerm');
    if (!box || !window.HWV) return;
    inputLine = box.querySelector('.ln-in');
    input = $('#hwInput');
    $('#hwSend').addEventListener('click', function () { if (st && st.phase === 'battle') run(input.value); input.value = ''; input.focus({ preventScroll: true }); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { if (st && st.phase === 'battle') run(input.value); input.value = ''; }
      else if (e.key === 'ArrowUp') { e.preventDefault(); var hi = Math.min(+(input.dataset.hi || -1) + 1, st.history.length - 1); input.dataset.hi = hi; input.value = st.history[hi] || ''; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); var hd = Math.max(+(input.dataset.hi || 0) - 1, -1); input.dataset.hi = hd; input.value = hd === -1 ? '' : (st.history[hd] || ''); }
    });
    box.addEventListener('click', function () { input.focus({ preventScroll: true }); });
    ratingTags();

    var hasSave = false;
    try { var sv = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); hasSave = !!(sv && sv.v === 1); } catch (e) {}
    if (hasSave) { $('#hwResumeBtn').style.display = ''; $('#hwResumeBtn').onclick = function () { loadSave(); }; }

    document.querySelectorAll('#hwStart [data-days]').forEach(function (b) {
      b.onclick = function () {
        if (hasSave && !confirm('检测到上次演练存档，新开一局将覆盖。继续？')) return;
        if (hasSave) localStorage.removeItem(SAVE_KEY);
        startPrep(+b.dataset.days);
      };
    });
    // 难度模式选择（开局画面）
    if (window.DIFF) {
      var drow = document.createElement('div');
      drow.style.cssText = 'margin:6px 0 12px';
      drow.innerHTML = '<div style="font-size:12px;color:var(--tx3);margin-bottom:6px">🎚️ 难度模式 <span id="hwDiffDesc" style="color:var(--am)"></span></div><div id="hwDiffChips" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"></div>';
      var btnRow = $('#startBtn') ? $('#startBtn').parentNode : document.querySelector('#hwStart');
      btnRow.parentNode.insertBefore(drow, btnRow);
      var dsync = function () { var l = DIFF.lv('hwv'); document.getElementById('hwDiffDesc').textContent = '当前：' + l.ico + ' ' + l.name + ' —— ' + l.desc; };
      DIFF.mount('hwv', document.getElementById('hwDiffChips'), dsync);
      dsync();
    }

    window.addEventListener('beforeunload', saveMatch);
    window.addEventListener('pagehide', saveMatch);
    document.addEventListener('visibilitychange', function () { if (document.hidden) saveMatch(); });
  });
})();
