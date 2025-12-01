(() => {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  const indicator = document.querySelector('.tab-indicator');
  const output = document.getElementById('output');
  const logs = document.getElementById('logs');
  const progress = document.getElementById('progress');
  const btnCopy = document.querySelector('[data-action="copy-json"]');
  const btnDownload = document.querySelector('[data-action="download-json"]');
  const btnExport = document.querySelector('[data-action="export-wp"]');
  const themeToggle = document.getElementById('theme-toggle');
  const darkSheet = document.getElementById('theme-dark');
  const bridgeOutput = document.getElementById('figma-json-output');
  const btnCopyManual = document.getElementById('copy-manual');
  let lastPayload = '';

  const fields = {
    use_ai: document.getElementById('use_ai'),
    provider_ai: document.getElementById('provider_ai'),
    gemini_api_key: document.getElementById('gemini_api_key'),
    gemini_model: document.getElementById('gemini_model'),
    gpt_api_key: document.getElementById('gpt_api_key'),
    gpt_model: document.getElementById('gpt_model'),
    auto_fix_layout: document.getElementById('auto_fix_layout'),
    wp_url: document.getElementById('wp_url'),
    wp_user: document.getElementById('wp_user'),
    wp_token: document.getElementById('wp_token'),
    wp_export_images: document.getElementById('wp_export_images'),
    wp_create_page: document.getElementById('wp_create_page')
  };
  const aiSettings = document.getElementById('ai_settings');

  const storage = null; // desativado para evitar SecurityError em sandbox

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

  function setProvider(providerId) {
    const value = providerId === 'gpt' ? 'gpt' : 'gemini';
    document.body?.setAttribute('data-provider', value);
    if (fields.provider_ai) fields.provider_ai.value = value;
  }

  function toggleAIFields(enabled) {
    document.body?.setAttribute('data-use-ai', enabled ? 'true' : 'false');
    if (aiSettings) {
      aiSettings.classList.toggle('ai-hidden', !enabled);
    }
  }

  tabs.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));

  function applyTheme(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    if (themeToggle) themeToggle.checked = isDark;
    if (darkSheet) darkSheet.disabled = !isDark;
    if (storage) {
      try { storage.setItem('figtoel-theme', isDark ? 'dark' : 'light'); } catch (_) { /* ignore */ }
    }
  }

  function initTheme(pref) {
    let stored = null;
    if (storage) {
      try { stored = storage.getItem('figtoel-theme'); } catch (_) { stored = null; }
    }
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
    const useAI = payload.useAI;
    if (fields.use_ai) {
      const val = typeof useAI === 'boolean' ? useAI : true;
      fields.use_ai.checked = val;
      toggleAIFields(val);
    }
    if (fields.provider_ai) setProvider(payload.providerAi || 'gemini');
    if (fields.gemini_api_key) fields.gemini_api_key.value = payload.geminiKey || '';
    if (fields.gemini_model && payload.geminiModel) fields.gemini_model.value = payload.geminiModel;
    if (fields.gpt_api_key) fields.gpt_api_key.value = payload.gptKey || '';
    if (fields.gpt_model && payload.gptModel) fields.gpt_model.value = payload.gptModel;
    if (fields.auto_fix_layout) fields.auto_fix_layout.checked = !!payload.autoFixLayout;
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
    if (fields.use_ai) {
      fields.use_ai.addEventListener('change', () => {
        const enabled = fields.use_ai.checked;
        toggleAIFields(enabled);
        send('save-setting', { key: 'gptel_use_ai', value: enabled });
      });
    }
    if (fields.provider_ai) {
      fields.provider_ai.addEventListener('change', () => {
        setProvider(fields.provider_ai.value);
        send('save-setting', { key: 'provider_ai', value: fields.provider_ai.value });
      });
    }
    if (fields.gemini_api_key) fields.gemini_api_key.addEventListener('input', saveText('gptel_gemini_key', fields.gemini_api_key));
    if (fields.gemini_model) fields.gemini_model.addEventListener('change', () => send('save-setting', { key: 'gemini_model', value: fields.gemini_model.value }));
    if (fields.gpt_api_key) fields.gpt_api_key.addEventListener('input', saveText('gptApiKey', fields.gpt_api_key));
    if (fields.gpt_model) fields.gpt_model.addEventListener('change', () => send('save-setting', { key: 'gptModel', value: fields.gpt_model.value }));
    if (fields.auto_fix_layout) fields.auto_fix_layout.addEventListener('change', () => send('save-setting', { key: 'auto_fix_layout', value: fields.auto_fix_layout.checked }));
    if (fields.wp_url) fields.wp_url.addEventListener('input', saveText('gptel_wp_url', fields.wp_url));
    if (fields.wp_user) fields.wp_user.addEventListener('input', saveText('gptel_wp_user', fields.wp_user));
    if (fields.wp_token) fields.wp_token.addEventListener('input', saveText('gptel_wp_token', fields.wp_token));
    if (fields.wp_export_images) fields.wp_export_images.addEventListener('change', () => send('save-setting', { key: 'gptel_export_images', value: fields.wp_export_images.checked }));
    if (fields.wp_create_page) fields.wp_create_page.addEventListener('change', () => send('save-setting', { key: 'gptel_auto_page', value: fields.wp_create_page.checked }));
  }

  function bindActions() {
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled && ['copy-json', 'download-json', 'export-wp'].includes(btn.getAttribute('data-action') || '')) {
          return;
        }
        const action = btn.getAttribute('data-action');
        if (fields.gemini_model && fields.gemini_model.value) {
          send('save-setting', { key: 'gemini_model', value: fields.gemini_model.value });
        }
        const payload = {
          useAI: fields.use_ai?.checked !== false,
          providerAi: fields.provider_ai?.value || 'gemini',
          wpConfig: {
            url: fields.wp_url?.value || '',
            user: fields.wp_user?.value || '',
            token: fields.wp_token?.value || '',
            exportImages: fields.wp_export_images?.checked || false,
            autoPage: fields.wp_create_page?.checked || false
          },
          apiKey: fields.gemini_api_key?.value || '',
          gptApiKey: fields.gpt_api_key?.value || '',
          geminiModel: fields.gemini_model?.value || ''
        };
        if (payload.geminiModel) {
          send('save-setting', { key: 'gemini_model', value: payload.geminiModel });
        }
        switch (action) {
          case 'inspect-layout': send('inspect'); break;
          case 'generate-json':
            toggleProgress(true);
            send('generate-json', payload);
            break;
          case 'optimize-structure': send('optimize-structure', payload); break;
          case 'analyze-widgets': send('analyze-widgets', payload); break;
          case 'copy-json':
            if (lastPayload) copyWithFallback(lastPayload); else send('copy-json');
            break;
          case 'download-json':
            if (lastPayload) downloadPayload(lastPayload); else send('download-json');
            break;
          case 'export-wp': send('export-wp', payload); break;
          case 'reset':
            if (output) output.value = '';
            if (logs) logs.innerHTML = '';
            if (fields.gemini_model) fields.gemini_model.value = fields.gemini_model.options[0]?.value || '';
            toggleProgress(false);
            toggleResultButtons(false);
            addLog('Sessao reiniciada.', 'info');
            send('reset');
            break;
          case 'test-gemini': send('test-gemini', { apiKey: payload.apiKey }); break;
          case 'test-gpt': send('test-gpt', { apiKey: payload.gptApiKey }); break;
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
        if (msg.action === 'download' && msg.payload) downloadPayload(msg.payload);
        break;
      case 'generation-complete':
        lastPayload = msg.payload || '';
        if (output) {
          // limpa o campo de preview/figma; JSON final fica apenas no bridgeOutput
          output.value = '';
        }
        if (bridgeOutput) {
          bridgeOutput.value = msg.payload || '';
          requestAnimationFrame(() => {
            bridgeOutput.focus();
            bridgeOutput.select();
          });
        }
        addLog('JSON gerado.', 'info');
        toggleProgress(false);
        toggleResultButtons(true);
        break;
      case 'copy-json': {
        const txt = msg.payload || '';
        lastPayload = txt;
        const ensureSelection = () => {
          if (bridgeOutput) {
            bridgeOutput.value = txt;
            bridgeOutput.focus();
            bridgeOutput.select();
          }
        };
        ensureSelection();
        requestAnimationFrame(ensureSelection);
        setTimeout(ensureSelection, 60);
        addLog('JSON pronto para copiar. Clique em "Copiar JSON" ou use Ctrl+C.', 'info');
        break;
      }
      case 'generation-error':
        toggleProgress(false);
        toggleResultButtons(false);
        break;
      case 'generation-start':
        toggleProgress(true);
        if (output) output.value = '';
        if (bridgeOutput) bridgeOutput.value = '';
        toggleResultButtons(false);
        break;
      case 'gemini-status':
        addLog(msg.message || 'Status Gemini', msg.success ? 'success' : 'error');
        const gs = document.getElementById('gemini-status');
        if (gs) gs.textContent = msg.message;
        break;
      case 'gpt-status':
        addLog(msg.message || 'Status GPT', msg.success ? 'success' : 'error');
        const gptStatus = document.getElementById('gpt-status');
        if (gptStatus) gptStatus.textContent = msg.message;
        break;
      case 'wp-status':
        addLog(msg.message || 'Status WP', msg.success ? 'success' : 'error');
        const ws = document.getElementById('wp-status');
        if (ws) ws.textContent = msg.message;
        break;
      case 'upload-image-request': {
        const { id, name, mimeType, data } = msg;
        const wpUrl = fields.wp_url?.value || '';
        const wpUser = fields.wp_user?.value || '';
        const wpToken = fields.wp_token?.value || '';
        const endpoint = wpUrl ? wpUrl.replace(/\/+$/, '') + '/wp-json/wp/v2/media' : '';
        const respond = (payload) => parent.postMessage({ pluginMessage: { type: 'upload-image-response', id, ...payload } }, '*');

        if (!endpoint || !wpUser || !wpToken) {
          respond({ success: false, error: 'WP config ausente' });
          break;
        }
        try {
          const bytes = new Uint8Array(data || []);
          const blob = new Blob([bytes], { type: mimeType || 'image/webp' });
          const form = new FormData();
          form.append('file', blob, name || 'upload.webp');

          const auth = btoa(`${wpUser}:${wpToken}`);
          fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: `Basic ${auth}` },
            body: form
          }).then(async (res) => {
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
              respond({ success: false, error: body?.message || res.statusText });
              return;
            }
            respond({ success: true, url: body?.source_url, wpId: body?.id });
          }).catch(err => {
            respond({ success: false, error: err?.message || 'Erro de rede' });
          });
        } catch (err) {
          respond({ success: false, error: err?.message || 'Falha desconhecida no upload' });
        }
        break;
      }
      case 'log':
        if (typeof msg.message === 'string' && msg.message.includes('Iniciando pipeline')) {
          toggleProgress(true);
        }
        addLog(msg.message, msg.level);
        break;
      case 'layout-warning':
        addLog(msg.message || 'Aviso de layout', 'warn');
        const shouldFix = confirm(`Aviso: ${msg.message || 'problema de layout'}\nNode: ${msg.nodeId} (${msg.name || ''})\nTexto: ${msg.text || '(sem texto)'}\n\nDeseja ativar correção automática para esses casos?`);
        if (shouldFix) {
          send('save-setting', { key: 'auto_fix_layout', value: true });
          addLog('Correção automática habilitada (auto_fix_layout=true).', 'info');
        } else {
          addLog('Correção automática não habilitada.', 'warn');
        }
        break;
      case 'load-settings':
        loadStoredSettings(msg.payload);
        break;
    }
  };

  bindActions();
  watchInputs();
  initTheme();
  setProvider(fields.provider_ai?.value || 'gemini');
  toggleAIFields(fields.use_ai?.checked !== false);
  send('load-settings');
  setActiveTab('layout');
  if (fields.wp_token) fields.wp_token.setAttribute('type', 'password');

  function toggleResultButtons(enabled) {
    if (btnCopy) btnCopy.disabled = !enabled;
    if (btnDownload) btnDownload.disabled = !enabled;
    if (btnExport) btnExport.disabled = !enabled;
  }
  toggleResultButtons(false);

  function toggleProgress(show) {
    if (!progress) return;
    if (show) {
      progress.classList.remove('hidden');
      progress.style.display = 'flex';
    } else {
      progress.classList.add('hidden');
      progress.style.display = 'none';
    }
  }

  async function copyWithFallback(text, logLabel = 'JSON') {
    try {
      await navigator.clipboard.writeText(text);
      addLog(`${logLabel} copiado.`, 'success');
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) {
          addLog(`${logLabel} copiado (fallback).`, 'success');
          return true;
        }
      } catch (_) { /* ignore */ }
      if (bridgeOutput) {
        bridgeOutput.focus();
        bridgeOutput.select();
      }
      addLog(`Falha ao copiar. Selecione o campo e pressione Ctrl+C.`, 'warn');
      if (bridgeOutput) {
        bridgeOutput.focus();
        bridgeOutput.select();
      }
      return false;
    }
  }

  const copyToClipboard = (text) => copyWithFallback(text);

  function downloadPayload(text) {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elementor.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    addLog('Download iniciado.', 'info');
  }

  // Resizer handle (drag to resize the plugin window)
  const resizer = document.getElementById('resizer-handle');
  if (resizer) {
    let startX = 0, startY = 0, startW = window.innerWidth, startH = window.innerHeight;
    const onMove = (clientX, clientY) => {
      const newW = Math.min(1500, Math.max(600, startW + (clientX - startX)));
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
    // suporte touch
    const onTouchMove = (e) => {
      const t = e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    };
    const onTouchEnd = () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
    resizer.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      startW = window.innerWidth;
      startH = window.innerHeight;
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }, { passive: true });
  }

  if (btnCopyManual) {
    btnCopyManual.addEventListener('click', async () => {
      const txt = bridgeOutput?.value || '';
      if (bridgeOutput) {
        bridgeOutput.focus();
        bridgeOutput.select();
      }
      await copyWithFallback(txt, 'JSON');
    });
  }

  if (bridgeOutput) {
    bridgeOutput.addEventListener('click', () => {
      bridgeOutput.focus();
      bridgeOutput.select();
    });
  }
})();
