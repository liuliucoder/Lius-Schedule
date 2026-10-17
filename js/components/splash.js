

const SPLASH_SEEN_KEY = 'timetable.splashSeen';

function maybeShowSplash() {
  const el = $('#splash');
  if (!el) return;

  let seen = false;
  try { seen = localStorage.getItem(SPLASH_SEEN_KEY) === '1'; } catch (e) { seen = false; }
  if (seen) { el.remove(); return; }


  el.style.display = 'flex';
  requestAnimationFrame(() => el.classList.add('show'));

  const done = () => {
    el.classList.remove('show');
    try { localStorage.setItem(SPLASH_SEEN_KEY, '1'); } catch (e) {}
    setTimeout(() => el.remove(), 420);
  };

  const btn = $('#splashGo');
  if (btn) btn.onclick = done;
  el.onclick = (e) => { if (e.target === el) done(); };
}
