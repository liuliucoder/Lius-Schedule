


function openWeekPicker() {
  const wk = state.viewWeek ?? currentWeek();
  const total = Math.max(wk, Math.min(40, state.config.totalWeeks || 20));
  let cells = '';
  for (let i = 1; i <= total; i++) {
    cells += `<div class="week-cell${i === wk ? ' on' : ''}" data-wk="${i}">${i}</div>`;
  }
  $('#modalBody').innerHTML = `
    <h3>选择周次</h3>
    <div class="week-grid">${cells}</div>
    <div style="margin-top:16px; display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
      <button class="ghost" id="wkPrev">‹ 上一周</button>
      <button class="ghost" id="wkThis">回到本周</button>
      <button class="ghost" id="wkNext">下一周 ›</button>
    </div>
  `;
  $('#modal').classList.add('show');
  $('#modalBody').querySelectorAll('.week-cell').forEach(el => {
    el.onclick = () => pickWeek(+el.dataset.wk);
  });
  $('#wkPrev').onclick = () => pickWeek(Math.max(1, wk - 1));
  $('#wkNext').onclick = () => pickWeek(Math.min(total, wk + 1));
  $('#wkThis').onclick = () => pickWeek(currentWeek());
}

function showWeekList() {
  const wk = state.viewWeek ?? currentWeek();
  let html = '';
  for (let d = 1; d <= 5; d++) {
    const list = state.courses
      .filter(c => c.weekday === d && expandWeeks(c.weeks).includes(wk))
      .sort((a, b) => a.startSection - b.startSection);
    if (!list.length) continue;
    html += `<div style="margin-top:14px; font-size:13px; font-weight:600;">周${WD_CN[d]}</div>`;
    html += list.map(c => `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:9px 0; border-bottom:1px solid var(--line); font-size:13px;">
        <span>${esc(c.name)}</span>
        <span style="color:var(--sub); font-size:11px; white-space:nowrap;">第${c.startSection}-${c.endSection}节 ${esc(c.location || '')}</span>
      </div>`).join('');
  }
  if (!html) html = '<div class="hint" style="text-align:center; padding:22px 0;">这一周没有课</div>';
  $('#modalBody').innerHTML = `
    <h3>第 ${wk} 周课程</h3>
    ${html}
    <div style="margin-top:18px; display:flex; justify-content:center;">
      <button class="ghost" id="btnClose">关闭</button>
    </div>
  `;
  $('#modal').classList.add('show');
  $('#btnClose').onclick = closeModal;
}
