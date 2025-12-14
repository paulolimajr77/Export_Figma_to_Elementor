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
    wp_overwrite_images: document.getElementById('wp_overwrite_images'),
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

  function ensureWarningStack() {
    let host = document.getElementById('figtoel-warning-stack');
    if (!host) {
      host = document.createElement('div');
      host.id = 'figtoel-warning-stack';
      host.style.position = 'fixed';
      host.style.top = '16px';
      host.style.right = '16px';
      host.style.zIndex = '9999';
      host.style.display = 'flex';
      host.style.flexDirection = 'column';
      host.style.gap = '12px';
      host.style.maxWidth = '320px';
      document.body.appendChild(host);
    }
    return host;
  }

  function showLineHeightWarning(issues = []) {
    if (!Array.isArray(issues) || issues.length === 0) return;
    const host = ensureWarningStack();
    const isDark = document.documentElement.classList.contains('dark');
    const card = document.createElement('div');
    card.className = 'figtoel-warning-card';
    card.style.background = isDark ? 'rgba(255, 138, 76, 0.15)' : '#fff5ec';
    card.style.border = `1px solid ${isDark ? '#ff8a4c' : '#f9a55f'}`;
    card.style.color = isDark ? '#ffe8d9' : '#5b2d0a';
    card.style.padding = '12px 14px 10px';
    card.style.borderRadius = '10px';
    card.style.boxShadow = '0 12px 32px rgba(0,0,0,0.35)';
    card.style.backdropFilter = 'blur(10px)';
    card.style.fontSize = '12px';
    card.style.lineHeight = '1.4';

    const title = document.createElement('div');
    title.textContent = 'Line-height alto detectado';
    title.style.fontWeight = '600';
    title.style.fontSize = '13px';
    title.style.marginBottom = '6px';
    card.appendChild(title);

    const list = document.createElement('ul');
    list.style.margin = '0';
    list.style.paddingLeft = '18px';
    list.style.maxHeight = '120px';
    list.style.overflow = 'hidden';
    issues.slice(0, 3).forEach(issue => {
      const li = document.createElement('li');
      const ratio = Number(issue?.ratio || 0).toFixed(2);
      const px = Number(issue?.lineHeightPx || 0).toFixed(1);
      li.textContent = `${issue?.nodeName || 'Texto'} – ${px}px (${ratio}x)`;
      list.appendChild(li);
    });
    if (issues.length > 3) {
      const li = document.createElement('li');
      li.textContent = `+${issues.length - 3} itens`;
      list.appendChild(li);
    }
    card.appendChild(list);

    const footer = document.createElement('p');
    footer.textContent = 'Diminua o line-height no Figma antes de gerar o JSON para impedir que os botões estiquem.';
    footer.style.margin = '8px 0 0';
    footer.style.fontSize = '11px';
    card.appendChild(footer);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.marginTop = '10px';

    const button = document.createElement('button');
    button.textContent = 'Entendi';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.style.padding = '4px 10px';
    button.style.borderRadius = '6px';
    button.style.fontSize = '11px';
    button.style.background = isDark ? '#ff8a4c' : '#f08a45';
    button.style.color = '#fff';
    button.addEventListener('click', () => {
      card.remove();
    });

    actions.appendChild(button);
    card.appendChild(actions);
    host.appendChild(card);

    setTimeout(() => {
      card.remove();
    }, 9000);
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
    if (fields.wp_overwrite_images) fields.wp_overwrite_images.checked = !!payload.overwriteImages;
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
    if (fields.wp_overwrite_images) fields.wp_overwrite_images.addEventListener('change', () => send('save-setting', { key: 'gptel_overwrite_images', value: fields.wp_overwrite_images.checked }));
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
            overwriteImages: fields.wp_overwrite_images?.checked || false,
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

  async function convertToWebP(uint8Array, originalMime, targetQuality) {
    const blob = new Blob([new Uint8Array(uint8Array)], { type: originalMime || 'image/png' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
    }

    return new Promise(resolve => {
      const slider = document.getElementById('wp_webp_quality');
      const sliderValue = slider ? parseInt(slider.value, 10) / 100 : 0.85;
      const quality = (typeof targetQuality === 'number' && targetQuality > 0 && targetQuality <= 1)
        ? targetQuality
        : sliderValue;
      canvas.toBlob(result => {
        URL.revokeObjectURL(url);
        if (result) {
          resolve(result);
        } else {
          resolve(new Blob([new Uint8Array(uint8Array)], { type: 'image/webp' }));
        }
      }, 'image/webp', quality);
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
        const { id, name, mimeType, data, overwrite, needsConversion, quality } = msg;
        const wpUrl = fields.wp_url?.value || '';
        const wpUser = fields.wp_user?.value || '';
        const wpToken = fields.wp_token?.value || '';
        const endpoint = wpUrl ? wpUrl.replace(/\/+$/, '') + '/wp-json/wp/v2/media' : '';
        const respond = (payload) => parent.postMessage({ pluginMessage: { type: 'upload-image-response', id, ...payload } }, '*');

        if (!endpoint || !wpUser || !wpToken) {
          respond({ success: false, error: 'WP config ausente' });
          break;
        }
        const shouldOverwrite = typeof overwrite === 'boolean'
          ? overwrite
          : !!fields.wp_overwrite_images?.checked;

        const fileName = name || 'upload.webp';
        const fileBase = (fileName.replace(/\.[^.]+$/, '') || fileName).toLowerCase();
        const normalizedSlug = fileBase.replace(/[^a-z0-9_-]+/g, '-');
        const slugCandidates = Array.from(new Set([
          fileBase,
          normalizedSlug,
          normalizedSlug.replace(/_/g, '-'),
          normalizedSlug.replace(/-+/g, '-').replace(/^-|-$/g, '')
        ])).filter(Boolean);
        const needleVariants = Array.from(new Set([
          fileBase,
          fileBase.replace(/[_-]+/g, ''),
          fileBase.replace(/[^a-z0-9]+/g, '')
        ])).filter(Boolean);

        const auth = btoa(`${wpUser}:${wpToken}`);

        const fetchMediaList = async (query: string) => {
          const url = `${endpoint}?per_page=50&_fields=id,slug,source_url,title,media_details&${query}`;
          const res = await fetch(url, { headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } });
          if (!res.ok) {
            const bodyText = await res.text().catch(() => '');
            addLog(`Falha ao consultar mídia (${res.status}): ${bodyText || res.statusText}`, 'warn');
            return [];
          }
          const items = await res.json().catch(() => []);
          return Array.isArray(items) ? items : [];
        };

        const matchesCandidate = (value?: string) => {
          if (!value) return false;
          const lower = value.toLowerCase();
          return slugCandidates.some(candidate => lower === candidate || lower.startsWith(`${candidate}-`));
        };

        const matchesByNeedle = (value?: string) => {
          if (!value) return false;
          const lower = value.toLowerCase();
          return needleVariants.some(needle => needle && lower.includes(needle));
        };

        const lookupExistingMedia = async (): Promise<number[]> => {
          if (!shouldOverwrite) return [];
          const matchedIds = new Set<number>();

          const collectMatches = (items: any[]) => {
            items.forEach(item => {
              const slug = (item?.slug || '').toLowerCase();
              const title = (item?.title?.rendered || '').toLowerCase();
              const source = (item?.source_url || '').toLowerCase();
              const mediaFile = (item?.media_details?.file || '').toLowerCase();
              const match =
                  matchesCandidate(slug) ||
                  matchesCandidate(title) ||
                  matchesByNeedle(slug) ||
                  matchesByNeedle(title) ||
                  matchesByNeedle(source) ||
                  matchesByNeedle(mediaFile);
              if (match && item?.id) {
                matchedIds.add(Number(item.id));
              }
            });
          };

          for (const slug of slugCandidates) {
            const items = await fetchMediaList(`slug=${encodeURIComponent(slug)}`);
            collectMatches(items);
          }

          if (!matchedIds.size) {
            const items = await fetchMediaList(`search=${encodeURIComponent(fileBase)}`);
            collectMatches(items);
          }

          return Array.from(matchedIds);
        };

        const deleteMedia = async (mediaId: number) => {
          const deleteUrl = `${endpoint}/${mediaId}?force=true`;
          const res = await fetch(deleteUrl, { method: 'DELETE', headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' } });
          if (!res.ok) {
            const bodyText = await res.text().catch(() => '');
            throw new Error(bodyText || res.statusText || `Falha ao remover mídia (status ${res.status})`);
          }
          addLog(`Mídia existente (#${mediaId}) removida antes do upload.`, 'info');
        };

        (async () => {
          try {
            if (shouldOverwrite) {
              const existingIds = await lookupExistingMedia();
              for (const mediaId of existingIds) {
                await deleteMedia(mediaId);
              }
            }

            const bytes = new Uint8Array(data || []);
            let uploadBlob: Blob;
            if (needsConversion) {
              addLog(`[UI] Convertendo ${name} para WebP...`, 'info');
              try {
                uploadBlob = await convertToWebP(bytes, mimeType || 'image/png', quality);
              } catch (conversionError) {
                console.warn('[UI] Falha ao converter para WebP:', conversionError);
                addLog('Falha ao converter para WebP. Usando formato original.', 'warn');
                uploadBlob = new Blob([bytes], { type: mimeType || 'image/png' });
              }
            } else {
              uploadBlob = new Blob([bytes], { type: mimeType || 'image/png' });
            }

            const form = new FormData();
            form.append('file', uploadBlob, fileName);

            const uploadRes = await fetch(endpoint, {
              method: 'POST',
              headers: { Authorization: `Basic ${auth}` },
              body: form
            });
            const body = await uploadRes.json().catch(() => ({}));
            if (!uploadRes.ok) {
              respond({ success: false, error: body?.message || uploadRes.statusText });
              return;
            }
            respond({ success: true, url: body?.source_url, wpId: body?.id });
          } catch (err) {
            respond({ success: false, error: err?.message || 'Erro de rede' });
          }
        })();
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
      case 'line-height-warning': {
        const issues = Array.isArray(msg.issues) ? msg.issues : [];
        if (issues.length) {
          issues.forEach(issue => {
            const ratio = Number(issue?.ratio || 0).toFixed(2);
            const px = Number(issue?.lineHeightPx || 0).toFixed(1);
            addLog(`Line-height alto em "${issue?.nodeName || 'Texto'}": ${px}px (${ratio}x).`, 'warn');
          });
          showLineHeightWarning(issues);
        }
        break;
      }
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
