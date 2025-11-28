(() => {
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('figtoel-theme');
  const initialDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);

  if (initialDark) document.body.classList.add('dark');
  if (themeToggle) themeToggle.checked = initialDark;

  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  const indicator = document.querySelector('.tab-indicator');
  const output = document.getElementById('output');
  const logs = document.getElementById('logs');

  const fields = {
    gemini_api_key: document.getElementById('gemini_api_key'),
    wp_url: document.getElementById('wp_url'),
    wp_user: document.getElementById('wp_user'),
    wp_token: document.getElementById('wp_token'),
    wp_export_images: document.getElementById('wp_export_images'),
    wp_create_page: document.getElementById('wp_create_page')
  };
  if (fields.wp_token) {
    fields.wp_token.setAttribute('type', 'password');
  }

  function updateIndicator() {
    const active = document.querySelector('.tab-btn.active');
    if (!indicator || !active) return;
    const rect = active.getBoundingClientRect();
    const parentRect = active.parentElement.getBoundingClientRect();
    indicator.style.width = rect.width + 'px';
    indicator.style.transform = 'translateX(' + (rect.left - parentRect.left) + 'px)';
  }

  function setActiveTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    contents.forEach(c => c.classList.toggle('active', c.id === 'tab-' + name));
    updateIndicator();
  }

  tabs.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));

  function toggleTheme(forceDark) {
    const shouldDark = typeof forceDark === 'boolean' ? forceDark : !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', shouldDark);
    if (themeToggle) themeToggle.checked = shouldDark;
    localStorage.setItem('figtoel-theme', shouldDark ? 'dark' : 'light');
  }

  if (themeToggle) {
    themeToggle.addEventListener('change', () => {
      toggleTheme(themeToggle.checked);
      send('save-setting', { key: 'gptel_dark_mode', value: themeToggle.checked });
    });
  }

  function send(type, payload = {}) {
    parent.postMessage({ pluginMessage: { type, ...payload } }, '*');
  }

  function addLog(message, level = 'info') {
    if (!logs) return;
    const div = document.createElement('div');
    div.textContent = '[' + level + '] ' + message;
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
    if (typeof payload.darkMode === 'boolean') toggleTheme(payload.darkMode);
    updateIndicator();
  }

  function watchInputs() {
    if (fields.gemini_api_key) fields.gemini_api_key.addEventListener('input', () => send('save-setting', { key: 'gptel_gemini_key', value: fields.gemini_api_key.value }));
    if (fields.wp_url) fields.wp_url.addEventListener('input', () => send('save-setting', { key: 'gptel_wp_url', value: fields.wp_url.value }));
    if (fields.wp_user) fields.wp_user.addEventListener('input', () => send('save-setting', { key: 'gptel_wp_user', value: fields.wp_user.value }));
    if (fields.wp_token) fields.wp_token.addEventListener('input', () => send('save-setting', { key: 'gptel_wp_token', value: fields.wp_token.value }));
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
              case 'inspect': send('inspect'); break;
          case 'generate-json': send('generate-json', payload); break;
          case 'copy-json': send('copy-json'); break;
          case 'download-json': send('download-json'); break;
          case 'export-wp': send('export-wp', payload); break;
          case 'test-gemini': send('test-gemini', { apiKey: payload.apiKey }); break;
          case 'test-wp': send('test-wp', { wpConfig: payload.wpConfig }); break;
          case 'resize-large': send('resize-ui', { width: Math.min(window.innerWidth + 200, 1400), height: Math.min(window.innerHeight + 200, 1000) }); break;
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
    const msg = event.data.pluginMessage;
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
  send('load-settings');
  setActiveTab('layout');
})();
