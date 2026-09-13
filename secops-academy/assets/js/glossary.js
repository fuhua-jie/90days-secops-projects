/* glossary.js — 术语速查：搜索 + 分类筛选 */
(function () {
  const $ = s => document.querySelector(s);
  let cat = '全部', kw = '';

  function renderCats() {
    $('#catRow').innerHTML = GLOSSARY_CATS.map(c =>
      `<button class="chip ${c === cat ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');
    document.querySelectorAll('#catRow .chip').forEach(b => {
      b.onclick = () => { cat = b.dataset.c; render(); };
    });
  }

  function render() {
    const kw2 = kw.trim().toLowerCase();
    const list = GLOSSARY.filter(g => {
      const okCat = cat === '全部' || g.c === cat;
      const okKw = !kw2 || (g.t + g.en + g.d + (g.eg || '')).toLowerCase().includes(kw2);
      return okCat && okKw;
    });
    $('#termGrid').innerHTML = list.map(g => `
      <div class="card term-card">
        <h4>${g.t} <span class="en">${g.en && g.en !== '—' ? g.en : ''}</span></h4>
        <p>${g.d}</p>
        ${g.eg ? `<div class="t-eg"><b>例</b> ${g.eg}</div>` : ''}
        <div style="margin-top:10px"><span class="tag cy">${g.c}</span></div>
      </div>`).join('');
    $('#termEmpty').style.display = list.length ? 'none' : 'block';
    $('#termCount').textContent = `共 ${GLOSSARY.length} 条 · 当前显示 ${list.length} 条`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderCats();
    render();
    let t = null;
    $('#termSearch').addEventListener('input', e => {
      clearTimeout(t);
      t = setTimeout(() => { kw = e.target.value; render(); }, 120);
    });
  });
})();
