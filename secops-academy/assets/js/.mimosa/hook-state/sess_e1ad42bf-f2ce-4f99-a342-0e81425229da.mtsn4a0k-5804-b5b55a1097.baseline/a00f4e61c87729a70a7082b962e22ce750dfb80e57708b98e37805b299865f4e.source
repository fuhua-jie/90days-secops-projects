/* ============================================================
   Progress — XP / 等级 / 徽章 系统（localStorage 持久化）
   ============================================================ */
(function () {
  const KEY = 'secops_progress_v1';

  const LEVELS = [
    { xp: 0,    title: '实习监控员' },
    { xp: 120,  title: '一线值守生' },
    { xp: 300,  title: '初级安全分析师' },
    { xp: 550,  title: '安全运营工程师' },
    { xp: 850,  title: '资深分析师' },
    { xp: 1200, title: '应急响应专家' },
    { xp: 1600, title: '威胁猎手' },
    { xp: 2100, title: '蓝队队长' },
    { xp: 2700, title: '安全运营专家' },
    { xp: 3400, title: '守护者·传奇' },
  ];

  const BADGES = [
    { id: 'first-lesson', ico: '🎓', name: '第一课', desc: '完成第 1 节课程', test: d => d.lessons.length >= 1 },
    { id: 'ten-lessons',  ico: '📚', name: '勤学好问', desc: '完成 10 节课程', test: d => d.lessons.length >= 10 },
    { id: 'all-lessons',  ico: '🏆', name: '满级学员', desc: '完成全部课程', test: d => typeof LESSONS !== 'undefined' && d.lessons.length >= LESSONS.length },
    { id: 'quiz-10',      ico: '✏️', name: '小试牛刀', desc: '答题 10 道', test: d => d.quiz.total >= 10 },
    { id: 'quiz-40',      ico: '🧠', name: '题库收割机', desc: '答题 40 道', test: d => d.quiz.total >= 40 },
    { id: 'quiz-ace',     ico: '🎯', name: '百发百中', desc: '累计答对 ≥20 题且正确率 ≥90%', test: d => d.quiz.total >= 20 && d.quiz.correct / d.quiz.total >= 0.9 },
    { id: 'log-detective',ico: '🔍', name: '日志侦探', desc: '日志侦探得分 ≥ 80%', test: d => (d.games.log / 100 || 0) >= 80 },
    { id: 'phish-master', ico: '🎣', name: '反钓鱼专家', desc: '钓鱼判官全对一次', test: d => (d.games.phish || 0) >= 100 },
    { id: 'cold-blood',   ico: '🚨', name: '冷静值日生', desc: '值班模拟器拿到 S 评价', test: d => (d.games.sim || '') === 'S' },
    { id: 'fast-hand',    ico: '⚡', name: '手速惊人', desc: '极速分诊 30 秒内答对 ≥15', test: d => (d.games.triage || 0) >= 15 },
    { id: 'combo-10',     ico: '🔥', name: '连击大师', desc: '极速分诊达成 10 连击', test: d => (d.games.combo || 0) >= 10 },
    { id: 'early-bird',   ico: '🌅', name: '每日坚持', desc: '完成 3 次每日挑战', test: d => (d.daily || 0) >= 3 },
    { id: 'sim-pass',     ico: '🛡️', name: '处置有方', desc: '通过一次值班模拟', test: d => !!d.games.sim },
    { id: 'case-master',  ico: '🧩', name: '复盘大师', desc: '正确决策 10 次案例抉择', test: d => (d.caseRight || 0) >= 10 },
    { id: 'lab-pass',      ico: '💻', name: '靶场通关', desc: '完成实战靶场终端的应急响应', test: d => !!d.games.lab },
    { id: 'ctf-gold',      ico: '⚔️', name: '攻防精英', desc: 'CTF 排位分达到 1200（荣耀黄金）', test: () => parseInt(localStorage.getItem('ctf_rating') || '0', 10) >= 1200 },
  ];

  function blank() {
    return {
      xp: 0,
      lessons: [],            // 已完成课程 id
      checks: {},             // 课内小测正确记录
      quiz: { total: 0, correct: 0, wrong: [] },
      games: {},              // { log:0-100, phish:0-100, sim:'S'|'A'..., triage:num, combo:num }
      daily: 0,
      dailyDate: '',
      caseRight: 0,
    };
  }

  let data = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = Object.assign(blank(), JSON.parse(raw));
  } catch (e) { /* 忽略损坏数据 */ }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }

  const listeners = [];
  function onChange() { save(); listeners.forEach(f => { try { f(data); } catch (e) {} }); }

  const Progress = {
    data,
    onInit(fn) { listeners.push(fn); },

    /* ---------- 等级 ---------- */
    level() {
      let idx = 0;
      for (let i = 0; i < LEVELS.length; i++) if (data.xp >= LEVELS[i].xp) idx = i;
      return idx + 1;
    },
    levelTitle() { return LEVELS[this.level() - 1].title; },
    levelRange() {
      const cur = LEVELS[this.level() - 1];
      const next = LEVELS[this.level()];
      return { cur: cur.xp, next: next ? next.xp : cur.xp, title: cur.title };
    },
    xpPct() {
      const r = this.levelRange();
      if (r.next <= r.cur) return 100;
      return Math.min(100, Math.round(((data.xp - r.cur) / (r.next - r.cur)) * 100));
    },
    nextLevelXp() { const r = this.levelRange(); return r.next === r.cur ? r.cur : r.next; },

    /* ---------- XP ---------- */
    addXP(n, reason) {
      if (!n) return;
      const before = this.level();
      data.xp += n;
      save();
      if (window.App) App.toast(`+${n} XP · ${reason}`, '⚡');
      const after = this.level();
      if (after > before) {
        Progress.checkBadges();
        if (window.App) App.levelUp(after, this.levelTitle());
      }
      Progress.bindUI();
      onChange();
    },

    /* ---------- 课程 ---------- */
    completeLesson(id) {
      if (data.lessons.includes(id)) return false;
      data.lessons.push(id);
      this.addXP(25, '完成课程');
      Progress.checkBadges();
      onChange();
      return true;
    },

    /* ---------- 题库 ---------- */
    recordQuiz(qid, correct) {
      data.quiz.total += 1;
      if (correct) {
        data.quiz.correct += 1;
        const i = data.quiz.wrong.indexOf(qid);
        if (i > -1) data.quiz.wrong.splice(i, 1);
      } else if (!data.quiz.wrong.includes(qid)) {
        data.quiz.wrong.push(qid);
      }
      this.addXP(correct ? 10 : 2, correct ? '答对一题' : '参与练习');
      Progress.checkBadges();
      onChange();
    },

    /* ---------- 游戏 ---------- */
    recordGame(name, score) {
      const prev = data.games[name];
      if (typeof score === 'number') {
        if (typeof prev !== 'number' || score > prev) data.games[name] = score;
      } else {
        const rank = { S: 5, A: 4, B: 3, C: 2, D: 1 };
        if (!prev || (rank[score] || 0) > (rank[prev] || 0)) data.games[name] = score;
      }
      Progress.checkBadges();
      onChange();
    },
    bump(key) { data[key] = (data[key] || 0) + 1; Progress.checkBadges(); onChange(); },

    /* ---------- 每日挑战 ---------- */
    dailyDoneToday() {
      const today = new Date().toISOString().slice(0, 10);
      return data.dailyDate === today;
    },
    finishDaily() {
      const today = new Date().toISOString().slice(0, 10);
      if (data.dailyDate === today) return false;
      data.dailyDate = today;
      data.daily = (data.daily || 0) + 1;
      this.addXP(40, '每日挑战');
      Progress.checkBadges();
      onChange();
      return true;
    },

    /* ---------- 徽章 ---------- */
    badges() { return BADGES; },
    hasBadge(id) { return !!data.badges && data.badges.includes(id); },
    checkBadges() {
      if (!data.badges) data.badges = [];
      BADGES.forEach(b => {
        if (!data.badges.includes(b.id)) {
          let ok = false;
          try { ok = b.test(data); } catch (e) {}
          if (ok) {
            data.badges.push(b.id);
            if (window.App) App.toast(`获得徽章 ${b.ico} <b>${b.name}</b>`, '🏅', true);
          }
        }
      });
      save();
    },

    /* ---------- UI 绑定 ---------- */
    bindUI() {
      document.querySelectorAll('[data-xp-text]').forEach(el => el.textContent = data.xp + ' XP');
      document.querySelectorAll('[data-level-num]').forEach(el => el.textContent = this.level());
      document.querySelectorAll('[data-level-title]').forEach(el => el.textContent = this.levelTitle());
      document.querySelectorAll('[data-xp-bar]').forEach(el => el.style.width = this.xpPct() + '%');
    },

    reset() { data = blank(); save(); this.bindUI(); },
  };

  window.Progress = Progress;
})();
