


function renderTimetable() {
  const cfg = state.config;
  const days = 5;
  const wk = state.viewWeek ?? currentWeek();
  const grid = $('#grid');
  const todayStr = formatLocalDate(new Date());

  $('#ttTitle').textContent = `第${wk}周`;
  const monday = getMondayOfWeek(wk);

  grid.style.setProperty('--days', days);
  grid.style.gridTemplateColumns = `52px repeat(${days}, minmax(0,1fr))`;
  grid.innerHTML = '';

  const rowH = [];
  const mk = (cls, html, row, col) => {
    const d = document.createElement('div');
    d.className = 'cell ' + cls;
    if (html !== undefined) d.innerHTML = html;
    if (row) d.style.gridRow = row;
    if (col) d.style.gridColumn = col;
    grid.appendChild(d);
    return d;
  };

  let row = 1;
  rowH.push('46px');
  mk('head', '', row, 1);
  for (let d = 1; d <= days; d++) {
    const dateObj = new Date(monday);
    dateObj.setDate(dateObj.getDate() + (d - 1));
    const isToday = formatLocalDate(dateObj) === todayStr;
    const dateStr = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;
    const headEl = mk('head', `
      <div class="weekday">周${WD_CN[d]}</div>
      <div class="date">${dateStr}</div>
      <div class="dot${isToday ? '' : ' hide'}"></div>
    `, row, d + 1);
    headEl.onclick = () => showDayCourses(d);
  }
  row++;

  const rowOfSec = {};
  for (let s = 1; s <= cfg.sectionsPerDay; s++) {
    rowOfSec[s] = row;
    rowH.push('76px');
    const st = fmtHm(cfg.sectionStartTimes && cfg.sectionStartTimes[s - 1]) || '';
    const et = fmtHm(cfg.sectionEndTimes && cfg.sectionEndTimes[s - 1]) || '';
    mk('time', `<div class="idx">第${CN_IDX[s - 1] || s}节</div><div class="t">${st}</div><div class="t">${et}</div>`, row, 1);
    for (let d = 1; d <= days; d++) mk('slot', '', row, d + 1);
    row++;
  }
  grid.style.gridTemplateRows = rowH.join(' ');

  let shown = 0;
  state.courses
    .filter(c => c.weekday <= days && expandWeeks(c.weeks).includes(wk))
    .forEach(c => {
      shown++;
      const sRow = rowOfSec[c.startSection] || rowOfSec[1];
      const eRow = rowOfSec[Math.min(c.endSection, cfg.sectionsPerDay)] || sRow;
      const b = document.createElement('div');
      b.className = 'course';
      b.style.gridRow = `${sRow} / ${eRow + 1}`;
      b.style.gridColumn = c.weekday + 1;
      b.style.setProperty('--c-rgb', hexToRgbStr(colorOf(c.name)));
      b.innerHTML = `
        <b>${esc(c.name)}</b>
        ${c.location ? `<small class="at">${esc(c.location)}</small>` : ''}
        ${c.teacher ? `<small class="teacher">${esc(c.teacher)}</small>` : ''}
      `;
      b.addEventListener('click', () => showDetail(state.courses.indexOf(c)));
      grid.appendChild(b);
    });

  if (!shown) {
    $('#emptyTip').style.display = 'block';
    $('#emptyTip').innerHTML = `第 ${wk} 周没有课程`;
  } else {
    $('#emptyTip').style.display = 'none';
  }
}

function showDayCourses(weekday) {
  const wk = state.viewWeek ?? currentWeek();
  const dayCourses = state.courses.filter(c => 
    c.weekday === weekday && expandWeeks(c.weeks).includes(wk)
  ).sort((a, b) => a.startSection - b.startSection);

  if (dayCourses.length === 0) {
    uiAlert(`周${WD_CN[weekday]} 第 ${wk} 周 没有课程`);
    return;
  }

  const listHtml = dayCourses.map(c => {
    const st = fmtHm((state.config.sectionStartTimes && state.config.sectionStartTimes[c.startSection - 1])) || '';
    const et = fmtHm((state.config.sectionEndTimes && state.config.sectionEndTimes[c.endSection - 1])) || '';
    return `
      <div class="today-course-card" onclick="showDetail(${state.courses.indexOf(c)})" style="margin-bottom: 8px;">
        <div class="left-time" style="width: 60px;">
          <span class="start" style="font-size: 13px;">${st}</span>
          <span class="end" style="font-size: 10px;">${et}</span>
        </div>
        <div class="right-info">
          <span class="name" style="font-size: 14px;">${esc(c.name)}</span>
          <span class="loc" style="font-size: 11px;">${esc(c.location || '')} ${esc(c.teacher || '')}</span>
        </div>
      </div>
    `;
  }).join('');

  $('#modalBody').innerHTML = `
    <h3>周${WD_CN[weekday]} 课程 (第 ${wk} 周)</h3>
    <div style="margin-top: 10px;">${listHtml}</div>
    <div class="row" style="margin-top:16px; justify-content: center;">
      <button class="ghost" id="btnClose">关闭</button>
    </div>
  `;
  $('#modal').classList.add('show');
  $('#btnClose').onclick = () => $('#modal').classList.remove('show');
}

const PALETTE = ['#5b7cfa','#f2994a','#27ae60','#eb5757','#9b51e0','#2d9cdb','#f2c94c','#219653','#e07a5f','#6c5ce7'];

function colorOf(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function shiftWeek(delta) {
  const cur = state.viewWeek ?? currentWeek();
  const total = Math.max(1, Math.min(40, state.config.totalWeeks || 20));
  const next = Math.max(1, Math.min(total, cur + delta));
  if (next === cur) return;
  state.viewWeek = next;
  renderTimetable();
  const g = $('#grid');
  if (g) {
    const cls = delta > 0 ? 'anim-left' : 'anim-right';
    g.classList.remove('anim-left', 'anim-right');
    void g.offsetWidth;
    g.classList.add(cls);
    setTimeout(() => g.classList.remove(cls), 340);
  }
}

function pickWeek(n) {
  state.viewWeek = Math.max(1, Math.min(40, n));
  closeModal();
  switchTab('page-timetable');
  renderTimetable();
}
