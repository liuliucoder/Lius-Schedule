


const STORE_KEY = 'timetable.v3';



const VERSION_KEY = 'timetable.lastVersion';

const state = {
  config: {
    totalWeeks: 20,
    startDate: '2026-09-01',
    endDate: '',
    sectionsPerDay: 6,
    sectionStartTimes: ['08:00','08:55','10:05','11:00','14:00','14:55'],
    sectionEndTimes: ['08:45','09:40','10:35','11:20','14:45','15:40'],
    showWeekend: false
  },
  courses: [],
  viewWeek: null,
  viewDate: formatLocalDate(new Date())
};

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify({ config: state.config, courses: state.courses }));
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d.config) {
        Object.assign(state.config, d.config);
        if (!Array.isArray(state.config.sectionStartTimes) || state.config.sectionStartTimes.length === 0) {
          state.config.sectionStartTimes = ['08:00','08:55','10:05','11:00','14:00','14:55'];
        }
        if (!Array.isArray(state.config.sectionEndTimes) || state.config.sectionEndTimes.length === 0) {
          state.config.sectionEndTimes = ['08:45','09:40','10:35','11:20','14:45','15:40'];
        }
        const nSec = Math.max(1, Math.min(12, state.config.sectionStartTimes.length));
        while (state.config.sectionStartTimes.length < nSec) state.config.sectionStartTimes.push('08:00');
        state.config.sectionStartTimes.length = nSec;
        while (state.config.sectionEndTimes.length < nSec) state.config.sectionEndTimes.push('08:45');
        state.config.sectionEndTimes.length = nSec;
        state.config.sectionsPerDay = nSec;
      }
      if (Array.isArray(d.courses)) state.courses = d.courses;
    }
  } catch (e) { console.warn('读取本地数据失败', e); }
}
