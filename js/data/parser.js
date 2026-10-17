


const LOC_RE = /[楼室馆场]|校区|机房|操场|体育馆|报告厅|阶梯|教室|实验室|实训|中心/;






const TEACHER_RE = /(老师|教师|教授|讲师|助教|主讲)/;

const NAME_HINT_RE = /(学|论|概论|程|技术|原理|设计|分析|实验|实践|英语|数学|物理|化学|体育|政治|历史|地理|生物|编程|基础|语言|写作|思想|教育|经济|管理|课|法|史|习)/;

const CN_D = { '零':0, '一':1, '二':2, '两':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9, '十':10 };



function cnInt(str) {
  const t = String(str == null ? '' : str).trim();
  if (!t) return NaN;
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  if (t.length === 1) return CN_D[t] == null ? NaN : CN_D[t];
  if (t === '十') return 10;
  const i = t.indexOf('十');
  if (i === 0) return 10 + (CN_D[t[1]] || 0);
  if (i === t.length - 1) return (CN_D[t[0]] || 0) * 10;
  if (i > 0) return (CN_D[t[0]] || 0) * 10 + (CN_D[t[i + 1]] || 0);
  return NaN;
}



function normalizeCourseText(raw) {
  return String(raw == null ? '' : raw)
    .replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[\u3000\u00A0\u2007\u202F]/g, ' ')
    .replace(/[\u2010-\u2015\u2212~～]/g, '-')
    .replace(/[【】\[\]{}《》〈〉「」『』"'“”‘’]/g, ' ')
    .replace(/[|｜]/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* "1-2,4" → [1,2,4]；"1,2" → [1,2] */

function numsFromExpr(expr) {
  const out = [];
  String(expr).split(/[,、]/).forEach(part => {
    const t = part.trim();
    if (!t) return;
    const m = t.match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
    if (m) {
      const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
      if (a >= 1 && b >= a && b <= 20) for (let i = a; i <= b; i++) out.push(i);
      return;
    }
    if (/^\d{1,2}$/.test(t)) out.push(parseInt(t, 10));
  });
  return out;
}

/* "1-8,10-16" → [[1,8],[10,16]] */

function rangesFromExpr(expr) {
  const out = [];
  String(expr).split(/[,、]/).forEach(part => {
    const t = part.trim();
    if (!t) return;
    const m = t.match(/^(\d{1,2})(?:\s*-\s*(\d{1,2}))?$/);
    if (!m) return;
    const a = parseInt(m[1], 10);
    const b = m[2] ? parseInt(m[2], 10) : a;
    if (a >= 1 && a <= 40 && b >= a) out.push([a, Math.min(b, 40)]);
  });
  return out;
}



function looksLikeLocation(t) {
  const s = String(t || '').trim();
  if (!s || s.length < 2) return false;
  if (LOC_RE.test(s)) return true;
  if (/[号栋座层]/.test(s)) return true;
  if (/^[A-Za-z]{0,3}-?\d{2,4}[A-Za-z]?$/.test(s)) return true;

  if (/^(Room|Rm|Lab|Building|Bldg|Hall|Campus|Block)[A-Za-z]?\d{0,4}$/i.test(s)) return true;
  return false;
}

function parseCourseLine(raw) {
  const c = { name:'', teacher:'', location:'', weekday:null, startSection:null, endSection:null, weeks:null };
  let s = ' ' + normalizeCourseText(raw) + ' ';
  const ats = [];


  
  s = s.replace(/\b(Room|Rm|Lab|Building|Bldg|Hall|Campus|Block)\s*\.?\s*([A-Za-z]?\d{1,4}[A-Za-z]?)\b/gi,
    (m, w, n) => w + n);


  s = s.replace(/([\u4e00-\u9fa5]{2})([A-Z]\d{2,4}[A-Z]?)(?=\s*$)/, '$1 $2');
  const kwPatterns = [
    { key: 'name', regex: /(?:课程名称|课程名|科目|课名|名称|课程)\s*[:：]\s*([^\s,;:：]+)/ },
    { key: 'teacher', regex: /(?:任课教师|任课老师|授课教师|教师|老师|主讲人|主讲)\s*[:：]\s*([^\s,;:：]+)/ },
    { key: 'location', regex: /(?:上课地点|上课教室|教室地点|地点|教室|场地)\s*[:：]\s*([^\s,;:：]+)/ }
  ];
  kwPatterns.forEach(p => {
    const m = s.match(p.regex);
    if (m) { c[p.key] = m[1].trim(); s = s.replace(m[0], ' '); }
  });
  const hasExplicitName = !!c.name;


  s = s.replace(/@\s*([^\s,;:：]{1,20})/g, (m, v) => { ats.push(v); return ' '; });


  s = s.replace(/(?:星期|周|礼拜)\s*([一二三四五六日天1-7])/g, (m, d) => {
    const n = CN_NUM[d];
    if (n) c.weekday = n;
    return ' ';
  });
  if (c.weekday == null) {
    const em = s.match(/(?:^|\s)(mon|tues?|wed|thur?s?|fri|sat|sun)\.?(?=\s|$)/i);
    if (em) {
      const map = { mon:1, tue:2, tues:2, wed:3, thu:4, thur:4, thurs:4, fri:5, sat:6, sun:7 };
      const n = map[em[1].toLowerCase().replace(/\./g, '')];
      if (n) { c.weekday = n; s = s.replace(em[0], ' '); }
    }
  }


  const setSec = (arr) => {
    const nums = arr.filter(n => !isNaN(n) && n >= 1 && n <= 20);
    if (!nums.length) return;
    const a = Math.min.apply(null, nums), b = Math.max.apply(null, nums);
    if (c.startSection == null || a < c.startSection) c.startSection = a;
    if (c.endSection == null || b > c.endSection) c.endSection = b;
  };

  s = s.replace(/(?:^|\s)([1-8])([1-8])\s*节/g, (m, a, b) => {
    setSec([+a, +b]);
    return ' ';
  });

  s = s.replace(/(?:第\s*)?(\d{1,2}(?:\s*-\s*\d{1,2})?(?:\s*[,、]\s*\d{1,2}(?:\s*-\s*\d{1,2})?)*)\s*(?:小节|节)/g, (m, expr) => {
    const nums = numsFromExpr(expr);
    if (nums.length) { setSec(nums); return ' '; }
    return m;
  });

  s = s.replace(/(?:第\s*)?([一二三四五六七八九十]{1,3})\s*节/g, (m, cn) => {
    const n = cnInt(cn);
    if (isNaN(n)) return m;
    setSec([n]);
    return ' ';
  });

  s = s.replace(/([一二三四五六七八九十]{2,4})\s*节/g, (m, cn) => {
    setSec(String(cn).split('').map(cnInt));
    return ' ';
  });

  s = s.replace(/([一二三四五六七八九十])\s*节/g, (m, cn) => {
    const n = cnInt(cn);
    if (isNaN(n)) return m;
    setSec([n]);
    return ' ';
  });

    let ranges = [], parity = 'all';

  s = s.replace(/第?\s*(\d{1,2})\s*周\s*-\s*第?\s*(\d{1,2})\s*周/g, (m, a, b) => {
    const x = parseInt(a, 10), y = parseInt(b, 10);
    if (x >= 1 && y >= x) ranges.push([x, Math.min(y, 40)]);
    return ' ';
  });

  s = s.replace(/(?:第\s*)?(\d{1,2}(?:\s*-\s*\d{1,2})?(?:\s*[,、]\s*\d{1,2}(?:\s*-\s*\d{1,2})?)*)\s*(?:教学)?周(?:次)?/g, (m, expr) => {
    const r = rangesFromExpr(expr);
    if (r.length) { ranges = ranges.concat(r); return ' '; }
    return m;
  });

  s = s.replace(/(?:第\s*)?([一二三四五六七八九十]{1,3})\s*-\s*([一二三四五六七八九十]{1,3})\s*周/g, (m, a, b) => {
    const x = cnInt(a), y = cnInt(b);
    if (!isNaN(x) && !isNaN(y) && y >= x) { ranges.push([x, Math.min(y, 40)]); return ' '; }
    return m;
  });

  s = s.replace(/(?:\(\s*)?(单|双|奇|偶)\s*周?\s*\)?/g, (m, p) => {
    parity = /单|奇/.test(p) ? 'odd' : 'even';
    return ' ';
  });
  if (ranges.length) {
    ranges.sort((a, b) => a[0] - b[0]);
    c.weeks = { ranges, parity };
  } else if (parity !== 'all') {
    c.weeks = { ranges: [[1, state.config.totalWeeks || 20]], parity };
  }


  if (c.startSection == null) {
    const bare = s.match(/(?:^|\s)(\d{1,2})\s*[-~—－]\s*(\d{1,2})(?=\s|$)/);
    if (bare) {
      const x = parseInt(bare[1], 10), y = parseInt(bare[2], 10);
      if (x >= 1 && x <= 12 && y > x && y <= 12) {
        setSec([x, y]);
        s = s.replace(bare[0], ' ');
      }
    }
  }


  ats.forEach(v => {
    if (!c.location && looksLikeLocation(v)) c.location = v;
    else if (!c.teacher && /^[\u4e00-\u9fa5·]{2,4}$/.test(v)) c.teacher = v;
    else if (!c.location) c.location = v;
  });


  s = s.replace(/[()（）]/g, ' ');
  const tokens = s.split(/[\s,;:：/\\]+/)
    .map(t => t.trim())
    .filter(Boolean)
    .filter(t => !/^\d{1,2}$/.test(t))
    .filter(t => !/^[.\-·]+$/.test(t))
    .filter(t => !/^(必修|选修|限选|任选|公选|考试|考查|理论|上午|下午|晚上|第|共|学时|学分)$/.test(t));

  const rest = [];
  for (const t of tokens) {
    if (c.teacher && t === c.teacher) continue;
    if (c.location && t === c.location) continue;

    if (!c.teacher && /^(Mr|Mrs|Ms|Miss|Dr|Prof)\.?\s*[A-Za-z]/i.test(t)) { c.teacher = t; continue; }
    if (!c.location && looksLikeLocation(t)) { c.location = t; continue; }
    if (!c.teacher && TEACHER_RE.test(t)) {
      const stripped = t.replace(/[()（）]?(老师|教师|教授|讲师|助教|主讲)[()（）]?/g, '').trim();
      c.teacher = stripped.length >= 2 ? stripped : t;
      continue;
    }
    rest.push(t);
  }


  if (!c.teacher && rest.length >= 2) {
    const cand = rest.filter(t => /^[\u4e00-\u9fa5·]{2,4}$/.test(t) && !NAME_HINT_RE.test(t));
    if (cand.length) {
      cand.sort((a, b) => a.length - b.length);
      if (cand[0].length <= 3) {
        c.teacher = cand[0];
        rest.splice(rest.indexOf(cand[0]), 1);
      }
    }
  }


  if (!hasExplicitName) {
    const pool = rest.filter(t => !looksLikeLocation(t) && !/^[\d\-—－~]+$/.test(t));
    if (pool.length) {
      let pick = pool.find(t => t.length >= 2 && NAME_HINT_RE.test(t));
      if (!pick) pick = pool.reduce((a, b) => b.length > a.length ? b : a);
      c.name = pick;
      rest.splice(rest.indexOf(pick), 1);
    }
  } else {
    const i = rest.findIndex(t => t === c.name);
    if (i >= 0) rest.splice(i, 1);
  }

  if (!c.name && rest.length) {
    const pi = rest.findIndex(t => !looksLikeLocation(t));
    if (pi >= 0) c.name = rest.splice(pi, 1)[0];
  }
  if (!c.location && rest.length) {
    const li = rest.findIndex(t => looksLikeLocation(t));
    if (li >= 0) c.location = rest.splice(li, 1)[0];
  }
  if (!c.location && rest.length) c.location = rest.join(' ');

  if (c.location && rest.length) {
    const tail = rest.filter(t => /^\d{2,4}$/.test(t)).join('');
    if (tail && !c.location.includes(tail)) c.location += tail;
  }
  return c;
}



function splitNameTeacher(s) {
  const str = String(s || '').trim();
  const m = str.match(/^(.+?)\s*[（(]([^（()）]*)[)）]\s*$/);
  if (m && m[1].trim()) return { name: m[1].trim(), teacher: m[2].trim() };
  return { name: str, teacher: '' };
}


function parseWeekBrace(txt) {
  const raw = String(txt || '').trim();
  if (!raw) return null;
  const parity = /单/.test(raw) ? 'odd' : (/双/.test(raw) ? 'even' : 'all');
  const clean = raw.replace(/[|｜].*$/, '').replace(/[（(].*$/, '');
  const ranges = [];
  for (const part of clean.split(/[,，、;；\s]+/)) {
    const t = part.trim();
    if (!t) continue;
    const rm = t.match(/^(\d{1,2})\s*[-~—－到至]\s*(\d{1,2})$/);
    if (rm) ranges.push([+rm[1], +rm[2]]);
    else if (/^\d{1,2}$/.test(t)) ranges.push([+t, +t]);
  }
  return ranges.length ? { ranges, parity } : null;
}

function parseAnyText(text) {  text = String(text).replace(/\u00A0/g, ' ');
  const rawLines = text.replace(/\r\n?/g, '\n').split('\n');




  const hasTimeMark = (s) => /(?:星期|周|礼拜)\s*[一二三四五六日天1-7]/.test(s) && /节/.test(s);




  const U_TIME = /^周\s*([一二三四五六日天1-7])\s*第\s*([\d\s,，、\-~—－到至]+?)\s*节\s*[{\[]\s*([^}\]]*)\s*[}\]]\s*(.*)$/;
  const uLines = rawLines.map(r => r.replace(/\t/g, ' ').trim()).filter(Boolean);
  let uPairs = 0;
  for (let i = 1; i < uLines.length; i++) {
    if (U_TIME.test(uLines[i]) && !U_TIME.test(uLines[i - 1])) uPairs++;
  }
  if (uPairs >= 2) {
    const out = [];
    for (let i = 1; i < uLines.length; i++) {
      const m = uLines[i].match(U_TIME);
      if (!m) continue;
      const nameLine = uLines[i - 1];
      if (U_TIME.test(nameLine)) continue;
      const wd = CN_NUM[m[1]];
      const secs = m[2].split(/[,，、]/).map(x => parseInt(x, 10)).filter(n => !isNaN(n));
      if (!wd || !secs.length) continue;
      const nm = splitNameTeacher(nameLine);
      if (!nm.name || nm.name.includes('智能')) continue;

      if (/^(?:第[一二三四五六七八九十\d]+步|注意|说明|备注)/.test(nm.name)) continue;
      out.push({
        name: nm.name,
        teacher: nm.teacher,
        location: m[4].replace(/^[\s·,，、]+|[\s·,，、]+$/g, ''),
        weekday: wd,
        startSection: Math.min(...secs),
        endSection: Math.max(...secs),
        weeks: parseWeekBrace(m[3]),
      });
    }
    if (out.length >= 2) return out;
  }



  const WD_LINE = /^(?:星期|周|礼拜)\s*[一二三四五六日天1-7]\s*(?:[（(]?\s*\d{1,2}\s*[/\-.月]\s*\d{1,2}\s*[)）]?)?$/;
  const blocks = [];
  let buf = [];
  const flush = () => { if (buf.length) { blocks.push(buf); buf = []; } };
  for (const raw of rawLines) {
    const s = raw.replace(/\t/g, ' ').trim();
    if (!s) continue;
    if (WD_LINE.test(s) && buf.length) flush();
    if (hasTimeMark(s) && buf.some(hasTimeMark)) flush();
    buf.push(s);
  }
  flush();

  const courses = [];

  const NEW_TIME_RE = /^周\s*([一二三四五六日天1-7])\s*第\s*([\d\s,，、\-~—－到至]+?)\s*节\s*[{\[]\s*([^}\]]*?)\s*[}\]]\s*(.*)$/;

  for (const bl of blocks) {
    const joined = bl.join(' ');
    if (/^[\d,，\s\-]+$/.test(joined)) continue;      


    let hit = -1, hm = null;
    for (let i = 0; i < bl.length; i++) {
      const m = bl[i].match(NEW_TIME_RE);
      if (m) { hit = i; hm = m; break; }
    }
    if (hm) {
      const wd = CN_NUM[hm[1]];
      const secs = hm[2].split(/[,，、]/).map(x => parseInt(x, 10)).filter(n => !isNaN(n));
      if (wd && secs.length) {
        let weeks = null;
        const wStr = hm[3];
        const parityMatch = wStr.match(/[|｜]\s*(单周?|双周?|奇|偶)/);
        const parity = parityMatch ? (/单|奇/.test(parityMatch[1]) ? 'odd' : 'even') : 'all';
        const cleanW = wStr.replace(/[|｜].*$/, '').replace(/[（(].*$/, '');
        const ranges = [];
        for (const part of cleanW.split(/[,，、;；]/)) {
          const t = part.trim();
          if (!t) continue;
          const rm = t.match(/^(\d{1,2})\s*[-~—－到至]\s*(\d{1,2})$/);
          if (rm) ranges.push([+rm[1], +rm[2]]);
          else if (/^\d{1,2}$/.test(t)) ranges.push([+t, +t]);
        }
        if (ranges.length) weeks = { ranges, parity };


        const tail = hm[4].replace(/^["'\s]+|["'\s]+$/g, '');
        const others = bl.filter((_, k) => k !== hit).join(' ');
        const meta = parseCourseLine((others + ' ' + tail).trim());
        if (meta.name && !meta.name.includes('智能')) {
          courses.push({
            name: meta.name, teacher: meta.teacher || '', location: meta.location || '',
            weekday: wd, startSection: Math.min(...secs), endSection: Math.max(...secs), weeks,
          });
        }
        continue;
      }
    }




    let handledAny = false;
    for (let i = 0; i < bl.length; i++) {
      const m = bl[i].match(/^第\s*(\d{1,2})\s*[-~—－到至]\s*(\d{1,2})\s*节\s*[·•|]\s*(.+)$/);
      if (!m) continue;
      const parts = m[3].split(/\s*[·•|]\s*/).map(x => x.trim()).filter(Boolean);
      if (!parts.length) continue;
      const other = bl.filter((_, k) => k !== i).join(' ');
      const wdHit = other.match(/(?:星期|周|礼拜)\s*([一二三四五六日天1-7])/);
      let wd = wdHit ? CN_NUM[wdHit[1]] : null;
      let weeks = null, tempDate = '';
      const last = parts[parts.length - 1] || '';
      const mt = last.match(/^仅\s*(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})$/);
      if (mt) {
        tempDate = mt[1] + '-' + String(mt[2]).padStart(2, '0') + '-' + String(mt[3]).padStart(2, '0');
        parts.pop();
      } else if (/周/.test(last)) {
        const w = parseCourseLine(last).weeks;
        if (w) { weeks = w; parts.pop(); }
      }
      if (!wd && tempDate) wd = new Date(tempDate + 'T00:00:00').getDay() || 7;
      const nm = parts[0] || '';
      if (!wd || !nm || nm.includes('智能')) continue;
      let teacher = '', location = '';
      parts.slice(1).forEach(t => {
        if (looksLikeLocation(t)) {
          if (!location) location = t;
        } else if (!teacher && !/\d/.test(t)) {
          teacher = t;
        } else if (!location) {
          location = t;   
        } else if (!teacher) {
          teacher = t;
        }
      });
      const item = {
        name: nm, teacher, location, weekday: wd,
        startSection: +m[1], endSection: +m[2], weeks,
      };
      if (tempDate) { item.date = tempDate; item.temp = true; }
      courses.push(item);
      handledAny = true;
    }
    if (handledAny) continue;


    
    const mTempRaw = joined.match(/仅\s*(\d{4})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})/);
    const cleanJoined = joined.replace(/仅\s*\d{4}\s*[-/.年]\s*\d{1,2}\s*[-/.月]\s*\d{1,2}\s*日?/g, ' ');
    const c = parseCourseLine(cleanJoined);
    const tempDate = mTempRaw
      ? mTempRaw[1] + '-' + String(mTempRaw[2]).padStart(2, '0') + '-' + String(mTempRaw[3]).padStart(2, '0')
      : '';
    const wd = c.weekday || (tempDate ? (new Date(tempDate + 'T00:00:00').getDay() || 7) : null);
    if (c.name && wd && !c.name.includes('智能')) {
      const item = {
        name: c.name, teacher: c.teacher || '', location: c.location || '',
        weekday: wd, startSection: c.startSection || 1,
        endSection: c.endSection || c.startSection || 1, weeks: c.weeks,
      };
      if (tempDate) { item.date = tempDate; item.temp = true; }
      courses.push(item);
      continue;
    }


    for (const line of bl) {
      const d = parseCourseLine(line);
      if (d.name && d.weekday && !d.name.includes('智能')) {
        courses.push({
          name: d.name, teacher: d.teacher || '', location: d.location || '',
          weekday: d.weekday, startSection: d.startSection || 1,
          endSection: d.endSection || d.startSection || 1, weeks: d.weeks,
        });
      }
    }
  }
  return mergeAdjacent(courses);
}
function mergeAdjacent(list) {
  const out = [];
  const crossRest = (a, b) => {
    for (let s = a; s < b; s++) if (restAfter(s)) return true;
    return false;
  };
  for (const c of list) {
    const prev = out.find(x => x.weekday === c.weekday && x.name === c.name && x.teacher === c.teacher && x.location === c.location && JSON.stringify(x.weeks) === JSON.stringify(c.weeks) && c.startSection <= x.endSection + 1 && !crossRest(x.endSection, c.startSection));
    if (prev) prev.endSection = Math.max(prev.endSection, c.endSection);
    else out.push({ ...c });
  }
  return out;
}

function fillMerges(ws, rows) {
  const merges = ws['!merges'] || [];
  for (const m of merges) {
    const v = (rows[m.s.r] || [])[m.s.c];
    if (v === undefined) continue;
    for (let r = m.s.r; r <= m.e.r; r++) {
      if (!rows[r]) rows[r] = [];
      for (let cc = m.s.c; cc <= m.e.c; cc++) rows[r][cc] = v;
    }
  }
  return rows;
}

function parseSectionLabel(label) {
  const t = String(label).replace(/\s/g, '');
  let m = t.match(/(\d{1,2})[-~—－到至](\d{1,2})/);
  if (m) return [ +m[1], +m[2] ];
  m = t.match(/(\d{1,2})/);
  if (m) return [ +m[1], +m[1] ];
  const cn = t.match(/([一二三四五六七八九十])/);
  if (cn) {
    const map = { 一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10 };
    return [ map[cn[1]], map[cn[1]] ];
  }
  return null;
}

function parseWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
  const results = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    let rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: true, defval: '' });
    rows = fillMerges(ws, rows);
    const HDR = /(?:星期|周|礼拜)\s*([一二三四五六日天1-7])/;
    let headerRow = -1, colMap = {};
    for (let r = 0; r < Math.min(rows.length, 12); r++) {
      const map = {};
      (rows[r] || []).forEach((cell, ci) => {
        const m = String(cell || '').match(HDR);
        if (m && CN_NUM[m[1]]) map[ci] = CN_NUM[m[1]];
      });
      if (Object.keys(map).length >= 3) { headerRow = r; colMap = map; break; }
    }
    if (headerRow < 0) continue;
    for (let r = headerRow + 1; r < rows.length; r++) {
      const row = rows[r] || [];
      const sec = parseSectionLabel(String(row[0] ?? '') + ' ' + String(row[1] ?? ''));
      if (!sec) continue;
      for (const ciStr of Object.keys(colMap)) {
        const ci = +ciStr;
        const raw = String(row[ci] ?? '').trim();
        if (!raw) continue;
        const smart = parseAnyText(raw);
        if (smart.length) { results.push(...smart); continue; }
        const lines = raw.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
        const base = lines.length >= 2 ? parseStructuredLines(lines) : parseCourseLine(lines[0] || raw);
        if (!base.name || base.name.includes('智能')) continue;
        results.push({ name: base.name, teacher: base.teacher || '', location: base.location || '', weekday: colMap[ci], startSection: sec[0], endSection: sec[1], weeks: base.weeks });
      }
    }
  }
  return mergeAdjacent(results);
}

function parseStructuredLines(lines) {
  const c = { name:'', teacher:'', location:'', weeks:null };
  const remain = [];
  for (const line of lines) {
    if (/^(?:第)?\d{1,2}(?:[-~—－到至]\d{1,2})?周/.test(line.trim())) {
      const w = parseCourseLine(line).weeks;
      if (w) { c.weeks = c.weeks || w; continue; }
    }
    remain.push(line);
  }
  for (const line of remain) {
    if (!c.name) { c.name = line; continue; }
    if (!c.teacher && /^[\u4e00-\u9fa5·]{2,4}$/.test(line)) { c.teacher = line; continue; }
    if (!c.location) { c.location = line; continue; }
  }
  return c;
}
