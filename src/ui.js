(() => {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  const indicator = document.querySelector('.tab-indicator');
  const output = document.getElementById('output');
  const logs = document.getElementById('logs');
  const themeToggle = document.getElementById('theme-toggle');
  const darkSheet = document.getElementById('theme-dark');

  const fields = {
    gemini_api_key: document.getElementById('gemini_api_key'),
    wp_url: document.getElementById('wp_url'),
    wp_user: document.getElementById('wp_user'),
    wp_token: document.getElementById('wp_token'),
    wp_export_images: document.getElementById('wp_export_images'),
    wp_create_page: document.getElementById('wp_create_page')
  };

  function debounce(fn, wait = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function updateIndicator() {
    const active = document.querySelector('.tab-btn.active');
    if (!indicator || !active || !active.parentElement) return;
    const rect = active.getBoundingClientRect();
    const parentRect = active.parentElement.getBoundingClientRect();
    indicator.style.width = `${rect.width}px`;
    indicator.style.transform = `translateX(${rect.left - parentRect.left}px)`;
  }

  function setActiveTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === name));
    updateIndicator();
  }

  tabs.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));

  function applyTheme(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    if (themeToggle) themeToggle.checked = isDark;
    if (darkSheet) darkSheet.disabled = !isDark;
    localStorage.setItem('figtoel-theme', isDark ? 'dark' : 'light');
  }

  function initTheme(pref) {
    const stored = localStorage.getItem('figtoel-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (typeof pref === 'boolean') applyTheme(pref);
    else applyTheme(stored === 'dark' || (stored === null && prefersDark));
  }

  if (themeToggle) {
    themeToggle.addEventListener('change', () => {
      applyTheme(themeToggle.checked);
      send('save-setting', { key: 'gptel_dark_mode', value: themeToggle.checked });
    });
  }

  function send(type, payload = {}) {
    parent.postMessage({ pluginMessage: { type, ...payload } }, '*');
  }

  function addLog(message, level = 'info') {
    if (!logs) return;
    const div = document.createElement('div');
    div.textContent = `[${level}] ${message}`;
    logs.appendChild(div);
    logs.scrollTo(0, logs.scrollHeight);
  }

  function loadStoredSettings(payload) {
    if (!payload) return;
    if (fields.gemini_api_key) fields.gemini_api_key.value = payload.geminiKey || '';
    if (fields.wp_url) fields.wp_url.value = payload.wpUrl || '';
    if (fields.wp_user) fields.wp_user.value = payload.wpUser || '';
    if (fields.wp_token) fields.wp_token.value = payload.wpToken || '';
    if (fields.wp_export_images) fields.wp_export_images.checked = !!payload.exportImages;
    if (fields.wp_create_page) fields.wp_create_page.checked = !!payload.autoPage;
    if (typeof payload.darkMode === 'boolean') applyTheme(payload.darkMode);
    updateIndicator();
  }

  function watchInputs() {
    const saveText = (key, el) => debounce(() => send('save-setting', { key, value: el.value }));
    if (fields.gemini_api_key) fields.gemini_api_key.addEventListener('input', saveText('gptel_gemini_key', fields.gemini_api_key));
    if (fields.wp_url) fields.wp_url.addEventListener('input', saveText('gptel_wp_url', fields.wp_url));
    if (fields.wp_user) fields.wp_user.addEventListener('input', saveText('gptel_wp_user', fields.wp_user));
    if (fields.wp_token) fields.wp_token.addEventListener('input', saveText('gptel_wp_token', fields.wp_token));
    if (fields.wp_export_images) fields.wp_export_images.addEventListener('change', () => send('save-setting', { key: 'gptel_export_images', value: fields.wp_export_images.checked }));
    if (fields.wp_create_page) fields.wp_create_page.addEventListener('change', () => send('save-setting', { key: 'gptel_auto_page', value: fields.wp_create_page.checked }));
  }

  function bindActions() {
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const payload = {
          wpConfig: {
            url: fields.wp_url?.value || '',
            user: fields.wp_user?.value || '',
            token: fields.wp_token?.value || '',
            exportImages: fields.wp_export_images?.checked || false,
            autoPage: fields.wp_create_page?.checked || false
          },
          apiKey: fields.gemini_api_key?.value || ''
        };
        switch (action) {
          case 'inspect-layout': send('inspect'); break;
          case 'generate-json': send('generate-json', payload); break;
          case 'optimize-structure': send('optimize-structure', payload); break;
          case 'analyze-widgets': send('analyze-widgets', payload); break;
          case 'copy-json': send('copy-json'); break;
          case 'download-json': send('download-json'); break;
          case 'export-wp': send('export-wp', payload); break;
          case 'test-gemini': send('test-gemini', { apiKey: payload.apiKey }); break;
          case 'test-wp': send('test-wp', { wpConfig: payload.wpConfig }); break;
          default: send(action || 'noop', payload);
        }
      });
    });
    document.querySelectorAll('[data-rename]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-rename');
        send('rename-layer', { name });
      });
    });
  }

  window.onmessage = (event) => {
    const msg = (event.data || {}).pluginMessage;
    if (!msg) return;
    switch (msg.type) {
      case 'preview':
        if (output) output.value = msg.payload || '';
        break;
      case 'generation-complete':
        if (output) output.value = msg.payload || '';
        addLog('JSON gerado.', 'info');
        break;
      case 'gemini-status':
        addLog(msg.message || 'Status Gemini', msg.success ? 'success' : 'error');
        const gs = document.getElementById('gemini-status');
        if (gs) gs.textContent = msg.message;
        break;
      case 'wp-status':
        addLog(msg.message || 'Status WP', msg.success ? 'success' : 'error');
        const ws = document.getElementById('wp-status');
        if (ws) ws.textContent = msg.message;
        break;
      case 'log':
        addLog(msg.message, msg.level);
        break;
      case 'load-settings':
        loadStoredSettings(msg.payload);
        break;
    }
  };

  bindActions();
  watchInputs();
  initTheme();
  send('load-settings');
  setActiveTab('layout');
  if (fields.wp_token) fields.wp_token.setAttribute('type', 'password');

  // Resizer handle (drag to resize the plugin window)
  const resizer = document.getElementById('resizer-handle');
  if (resizer) {
    let startX = 0, startY = 0, startW = window.innerWidth, startH = window.innerHeight;
    const onMove = (clientX, clientY) => {
      const newW = Math.min(1500, Math.max(700, startW + (clientX - startX)));
      const newH = Math.min(1000, Math.max(500, startH + (clientY - startY)));
      send('resize-ui', { width: newW, height: newH });
    };
    const onMouseMove = (e) => { e.preventDefault(); onMove(e.clientX, e.clientY); };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      startW = window.innerWidth;
      startH = window.innerHeight;
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }
})();
