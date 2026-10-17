

function aboutEnvText() {
  try {
    if (typeof plus !== 'undefined' && plus.os && plus.os.name) {
      return plus.os.name + (plus.os.version ? ' ' + plus.os.version : '');
    }
  } catch (e) {}
  return '移动端 WebView';
}

function renderAbout() {
  const verEl = $('#aboutVersion');
  if (verEl) verEl.textContent = 'v' + APP_VERSION;
  const envEl = $('#aboutEnvValue');
  if (envEl) envEl.textContent = aboutEnvText();
}

function openPrivacy() {
  $('#modalBody').innerHTML = `
    <h3>隐私说明</h3>
    <div class="about-doc">
      <p>这个 App 不联网、不上传、不埋点。</p>
      <p><b>存在哪：</b>你的课程、主题、背景图、提醒设置全部保存在本机浏览器存储（localStorage）里，卸载 App 或清除数据即消失。</p>
      <p><b>谁会看到：</b>只有你。App 没有任何服务端，也没有第三方 SDK 收集数据。</p>
      <p><b>备份建议：</b>换机前请先在「导入课程」里把课表导出成 Excel 留一份。</p>
    </div>
    <div style="margin-top:18px; display:flex; justify-content:center;">
      <button id="btnClose" style="min-width:140px;">知道了</button>
    </div>
  `;
  $('#modal').classList.add('show');
  $('#btnClose').onclick = () => $('#modal').classList.remove('show');
}

function bindAbout() {
  const cl = $('#aboutChangelog');
  if (cl) cl.onclick = () => switchTab('page-changelog');
  const pv = $('#aboutPrivacy');
  if (pv) pv.onclick = () => openPrivacy();
  const bk = $('#btnAboutBack');
  if (bk) bk.onclick = () => switchTab('page-mine');
  renderAbout();
  document.addEventListener('plusready', renderAbout, false);
}

bindAbout();
