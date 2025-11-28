(() => {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  const output = document.getElementById('output');
  const logs = document.getElementById('logs');
  let lastJSON = '';

  function setActiveTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    contents.forEach(c => {
      const isActive = c.id === `tab-${name}`;
      if (isActive) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
  }

  tabs.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));

  function send(type, payload = {}) {
    parent.postMessage({ pluginMessage: { type, ...payload } }, '*');
  }

  function addLog(message, level = 'info') {
    const div = document.createElement('div');
    div.textContent = `[${level}] ${message}`;
    logs?.appendChild(div);
    logs?.scrollTo(0, logs.scrollHeight);
  }

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      const payload = {
        debug: true,
        wpConfig: {
          url: (document.getElementById('wp-url') as HTMLInputElement)?.value || '',
          token: (document.getElementById('wp-token') as HTMLInputElement)?.value || '',
          exportImages: (document.getElementById('chk-export-images') as HTMLInputElement)?.checked || false,
          createPage: (document.getElementById('chk-create-page') as HTMLInputElement)?.checked || false
        },
        apiKey: (document.getElementById('ai-key') as HTMLInputElement)?.value || ''
      };

      switch (action) {
        case 'inspect':
          send('inspect');
          break;
        case 'generate-json':
          send('generate-json', payload);
          break;
        case 'copy-json':
          send('copy-json');
          break;
        case 'download-json':
          send('download-json');
          break;
        case 'export-wp':
          send('export-wp', payload);
          break;
        case 'test-gemini':
          send('test-gemini', { apiKey: payload.apiKey });
          break;
        case 'test-wp':
          send('test-wp', { wpConfig: payload.wpConfig });
          break;
      }
    });
  });

  window.onmessage = (event) => {
    const msg = event.data.pluginMessage;
    if (!msg) return;

    switch (msg.type) {
      case 'preview':
        if (output) output.value = msg.payload || '';
        break;
      case 'generation-complete':
        lastJSON = msg.payload || '';
        if (output) output.value = lastJSON;
        addLog('JSON gerado.');
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
      case 'toggle-theme':
        toggleTheme();
        break;
    }
  };
})();
  function toggleTheme() {
    document.body.classList.toggle('dark');
  }
