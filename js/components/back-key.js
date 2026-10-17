


function applyImmersive() {
  if (!window.plus || !plus.webview) return;
  try {
    const wv = plus.webview.currentWebview();
    if (wv && wv.setStyle) wv.setStyle({ top: '0px', bottom: '0px' });
    let h = 0;
    if (plus.navigator && plus.navigator.getStatusbarHeight) h = plus.navigator.getStatusbarHeight() || 0;
    document.documentElement.style.setProperty('--sb', h + 'px');
    document.body.classList.add('immersed');
    syncStatusBar();
  } catch (e) {}
}






function closeTopLayer() {
  const dp = document.getElementById('dpModal');
  if (dp && dp.classList.contains('show')) { dpClose(); return true; }
  const dlg = document.getElementById('uiDialog');
  if (dlg && dlg.classList.contains('show')) { udClose(null); return true; }
  const tp = $('#tpModal');
  if (tp && tp.classList.contains('show')) { closeTimePicker(); return true; }
  const m = $('#modal');
  if (m && m.classList.contains('show')) { closeModal(); return true; }
  return false;
}

function handleBackKey() {
  if (closeTopLayer()) return;
  const cur = currentTabId();
  if (cur === 'page-notify') { switchTab('page-reminder'); return; }
  if (cur === 'page-import' || cur === 'page-about' || cur === 'page-reminder' || cur === 'page-theme') { switchTab('page-mine'); return; }
  if (cur !== 'page-today') { switchTab('page-today'); return; }
  if (window.plus && plus.runtime && plus.runtime.quit) plus.runtime.quit();
}

let backKeyBound = false;

function bindBackKey() {
  if (backKeyBound) return;
  if (!window.plus || !plus.key || !plus.key.addEventListener) return;
  backKeyBound = true;
  try { plus.key.addEventListener('backbutton', handleBackKey); } catch (e) { backKeyBound = false; }
}
