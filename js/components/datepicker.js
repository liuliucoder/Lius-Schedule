












const DP_WD = ['日', '一', '二', '三', '四', '五', '六'];
const DP_MONTH_CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

let dpCtx = null;   /* { title, value, clearable, onPick, viewY, viewM, picked } */

function dpParse(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s == null ? '' : s).trim());
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

function dpFmt(dt) {
  const p = n => String(n).padStart(2, '0');
  return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate());
}

function dpDom() {
  let el = document.getElementById('dpModal');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'dpModal';
  el.className = 'dp-modal';
  el.innerHTML =
    '<div class="dp-mask" id="dpMask"></div>' +
    '<div class="dp-card">' +
      '<div class="dp-title" id="dpTitle">选择日期</div>' +
      '<div class="dp-value" id="dpValue"></div>' +
      '<div class="dp-nav">' +
        '<button class="dp-arrow" id="dpPrev" aria-label="上个月">‹</button>' +
        '<div class="dp-ym" id="dpYm"></div>' +
        '<button class="dp-arrow" id="dpNext" aria-label="下个月">›</button>' +
      '</div>' +
      '<div class="dp-grid" id="dpGrid"></div>' +
      '<div class="dp-actions">' +
        '<button class="dp-clear ghost" id="dpClear">清除</button>' +
        '<span class="dp-gap"></span>' +
        '<button class="dp-cancel ghost" id="dpCancel">取消</button>' +
        '<button class="dp-ok" id="dpOk">设置</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(el);
  el.querySelector('#dpMask').addEventListener('click', dpClose);
  el.querySelector('#dpPrev').addEventListener('click', () => dpShift(-1));
  el.querySelector('#dpNext').addEventListener('click', () => dpShift(1));
  el.querySelector('#dpCancel').addEventListener('click', dpClose);
  el.querySelector('#dpClear').addEventListener('click', () => {
    const ctx = dpCtx;
    dpClose();
    if (ctx && ctx.onPick) ctx.onPick('');
  });
  el.querySelector('#dpOk').addEventListener('click', () => {
    const ctx = dpCtx;
    if (!ctx || !ctx.picked) return;
    const v = dpFmt(ctx.picked);
    dpClose();
    if (ctx.onPick) ctx.onPick(v);
  });
  return el;
}

function dpShift(delta) {
  if (!dpCtx) return;
  const d = new Date(dpCtx.viewY, dpCtx.viewM + delta, 1);
  dpCtx.viewY = d.getFullYear();
  dpCtx.viewM = d.getMonth();
  dpRender();
}

function dpRender() {
  if (!dpCtx) return;
  const root = document.getElementById('dpModal');
  if (!root) return;
  const ctx = dpCtx;

  root.querySelector('#dpTitle').textContent = ctx.title || '选择日期';
  const valEl = root.querySelector('#dpValue');
  if (ctx.picked) {
    valEl.textContent = ctx.picked.getFullYear() + '年' + (ctx.picked.getMonth() + 1) + '月' +
      ctx.picked.getDate() + '日 周' + DP_WD[ctx.picked.getDay()];
    valEl.classList.remove('empty');
  } else {
    valEl.textContent = '未选择';
    valEl.classList.add('empty');
  }
  root.querySelector('#dpYm').textContent = ctx.viewY + '年' + (ctx.viewM + 1) + '月';
  root.querySelector('#dpClear').style.visibility = ctx.clearable ? 'visible' : 'hidden';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const first = new Date(ctx.viewY, ctx.viewM, 1);

  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(ctx.viewY, ctx.viewM + 1, 0).getDate();

  let html = DP_WD.slice(1).concat(DP_WD[0]).map(w => '<div class="dp-wd">' + w + '</div>').join('');
  for (let i = 0; i < lead; i++) html += '<div class="dp-cell pad"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const cur = new Date(ctx.viewY, ctx.viewM, d);
    const cls = ['dp-cell'];
    if (dpFmt(cur) === dpFmt(today)) cls.push('today');
    if (ctx.picked && dpFmt(cur) === dpFmt(ctx.picked)) cls.push('on');
    html += '<div class="' + cls.join(' ') + '" data-d="' + d + '">' + d + '</div>';
  }
  root.querySelector('#dpGrid').innerHTML = html;

  root.querySelectorAll('.dp-cell[data-d]').forEach(cell => {
    cell.addEventListener('click', () => {
      ctx.picked = new Date(ctx.viewY, ctx.viewM, +cell.dataset.d);
      dpRender();
    });
  });
}

function openDatePicker(opts) {
  const o = opts || {};
  const root = dpDom();
  const cur = dpParse(o.value);
  const base = cur || new Date();
  dpCtx = {
    title: o.title || '选择日期',
    clearable: o.clearable !== false,
    onPick: o.onPick,
    picked: cur,
    viewY: base.getFullYear(),
    viewM: base.getMonth(),
  };
  dpRender();
  root.classList.add('show');
}

function dpClose() {
  const root = document.getElementById('dpModal');
  if (root) root.classList.remove('show');
  dpCtx = null;
}


function bindDateInput(input, opts) {
  if (!input) return;
  input.setAttribute('readonly', 'readonly');
  input.setAttribute('inputmode', 'none');
  input.classList.add('date-readonly');
  input.addEventListener('click', () => {
    const o = opts || {};
    openDatePicker({
      title: o.title || input.getAttribute('data-title') || '选择日期',
      value: input.value,
      clearable: o.clearable !== false,
      onPick: function (v) {
        input.value = v;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      },
    });
  });
  input.addEventListener('focus', () => input.blur());
}
