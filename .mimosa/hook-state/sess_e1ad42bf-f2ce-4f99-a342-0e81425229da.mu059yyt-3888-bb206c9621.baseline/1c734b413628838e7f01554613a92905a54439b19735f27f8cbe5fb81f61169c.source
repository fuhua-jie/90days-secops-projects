/* ============================================================
   diff.js — 全站游戏难度系统（新手 / 进阶 / 专家 / 大师）
   · 新手  🌱：每次要输入结论时直接给答案（主打学习）
   · 进阶  🎯：每步给提示，熟悉流程
   · 专家  🔥：无提示，只会遇到 1-2 星攻击
   · 大师  💀：无提示，可遇任何星级攻击
   每个游戏独立记忆（localStorage: diff_<game>）
   ============================================================ */
(function () {
  const LEVELS = [
    { id: 'novice', ico: '🌱', name: '新手', desc: '直接给答案，主打学习' },
    { id: 'advanced', ico: '🎯', name: '进阶', desc: '每步给提示，熟悉流程' },
    { id: 'expert', ico: '🔥', name: '专家', desc: '无提示 · 只遇 1-2 星攻击' },
    { id: 'master', ico: '💀', name: '大师', desc: '无提示 · 迎战任意攻击' },
  ];
  function get(game) {
    try { return localStorage.getItem('diff_' + game) || 'novice'; } catch (e) { return 'novice'; }
  }
  function set(game, id) {
    try { localStorage.setItem('diff_' + game, id); } catch (e) {}
  }
  function lv(game) { return LEVELS.find(l => l.id === get(game)) || LEVELS[0]; }
  function showAnswer(game) { return get(game) === 'novice'; }               // 新手：直接给答案
  function showHint(game) { return get(game) === 'novice' || get(game) === 'advanced'; }
  function hintOnly(game) { return get(game) === 'advanced'; }               // 进阶：给提示不给答案
  function maxStar(game) { return get(game) === 'expert' ? 2 : 3; }          // 专家只遇 1-2 星

  /* 在容器内渲染难度选择 chips */
  function mount(game, target, onChange) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    el.innerHTML = LEVELS.map(l =>
      `<button class="chip ${l.id === get(game) ? 'on' : ''}" data-d="${l.id}" title="${l.desc}" style="padding:7px 14px;font-size:12.5px">${l.ico} ${l.name}</button>`
    ).join('');
    el.querySelectorAll('.chip').forEach(b => {
      b.onclick = () => { set(game, b.dataset.d); mount(game, el, onChange); if (onChange) onChange(get(game)); };
    });
  }

  /* 状态徽章（战时 UI 用） */
  function badge(game) {
    const l = lv(game);
    return `<span class="chip on" style="padding:3px 10px;font-size:11.5px" title="${l.desc}">${l.ico} ${l.name}模式</span>`;
  }

  window.DIFF = { LEVELS, get, set, lv, showAnswer, showHint, hintOnly, maxStar, mount, badge };
})();
