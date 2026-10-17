

(function () {

  function on(sel, fn) { var el = $(sel); if (el) el.onclick = fn; }

  on('#ttTitle', openWeekPicker);
  on('#btnImportBack', function () { switchTab('page-mine'); });
  on('#mineAbout', function () { switchTab('page-about'); });
  on('#btnAboutBack', function () { switchTab('page-mine'); });
  on('#btnAnnounceBack', function () { switchTab(annReturnTab()); });
  on('#btnChangelogBack', function () { switchTab('page-mine'); });
  on('#mineImport', function () { switchTab('page-import'); });
  on('#mineAppearance', openThemePicker);
  on('#btnThemeBack', function () { switchTab('page-mine'); });
  on('#mineReminder', openReminderSettings);
  on('#tpCancel', closeTimePicker);
  on('#tpOk', confirmTimePicker);

  var tpModalEl = $('#tpModal');
  if (tpModalEl) tpModalEl.onclick = function (e) { if (e.target.id === 'tpModal') closeTimePicker(); };

  var bgInput = $('#bgInput');
  if (bgInput) bgInput.addEventListener('change', function (e) {
    handleBgFile(e.target.files[0]); e.target.value = '';
  });


  load();
  applyTheme();
  applyAccent();
  renderToday();
  renderImportSettings();
  switchTab('page-today');
  if (typeof renderMine === 'function') renderMine();
  checkFirstOpen();
  if (typeof maybeShowSplash === 'function') maybeShowSplash();


  if (typeof bindNoSelect === 'function') bindNoSelect();
  applyImmersive();
  bindBackKey();
  document.addEventListener('plusready', function () { applyImmersive(); bindBackKey(); }, false);


  startReminderLoop();
})();

