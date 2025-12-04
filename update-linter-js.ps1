$file = "src\ui.html"
$content = [IO.File]::ReadAllText($file, [Text.Encoding]::UTF8)

# 1. Update issue card rendering to include action buttons
$oldCardHTML = @'
            card.innerHTML = `
              <div class="issue-header">
                <div class="issue-title">
                  <span>${icon}</span>
                  <span>${issue.nodeName || 'Node'}</span>
                </div>
                <span class="issue-badge ${issue.severity}">${issue.severity}</span>
              </div>
              <div class="issue-desc">${issue.message}</div>
              <div class="issue-actions">
                <button class="btn tiny secondary" onclick="if('${issue.nodeId || issue.node_id}' && '${issue.nodeId || issue.node_id}'!=='undefined'){send('focus-node',{nodeId:'${issue.nodeId || issue.node_id}'})}else{alert('Node não encontrado: ${issue.nodeName || issue.node_name}')}">
                    📍 Ver no Figma
                </button>
              </div>
            `;
'@

$newCardHTML = @'
            // Check if this is a naming issue
            const isNamingIssue = issue.rule === 'widget-naming' || issue.rule === 'generic-name-detected';
            let suggestedName = '';
            if (isNamingIssue) {
              const match = issue.message.match(/"([^"]+)"/);
              if (match) suggestedName = match[1];
            }

            card.innerHTML = `
              <div class="issue-header">
                <div class="issue-title">
                  <span>${icon}</span>
                  <span>${issue.nodeName || issue.node_name || 'Node'}</span>
                </div>
                <span class="issue-badge ${issue.severity}">${issue.severity}</span>
              </div>
              <div class="issue-desc">${issue.message}</div>
              <div class="issue-actions" style="display: flex; gap: 6px; margin-top: 8px;">
                <button class="btn tiny secondary issue-btn-focus" data-node-id="${issue.nodeId || issue.node_id}" style="flex: 1;">
                  📍 Ver no Figma
                </button>
                ${isNamingIssue && suggestedName ? `
                  <button class="btn tiny primary issue-btn-rename" data-node-id="${issue.nodeId || issue.node_id}" data-name="${suggestedName}" style="flex: 2;">
                    ✨ Renomear
                  </button>
                ` : ''}
              </div>
            `;

            // Add event listeners to buttons
            const btnFocus = card.querySelector('.issue-btn-focus');
            if (btnFocus) {
              btnFocus.addEventListener('click', (e) => {
                e.stopPropagation();
                const nodeId = btnFocus.getAttribute('data-node-id');
                if (nodeId && nodeId !== 'undefined') {
                  send('focus-node', { nodeId });
                }
              });
            }

            const btnRename = card.querySelector('.issue-btn-rename');
            if (btnRename) {
              btnRename.addEventListener('click', (e) => {
                e.stopPropagation();
                const nodeId = btnRename.getAttribute('data-node-id');
                const name = btnRename.getAttribute('data-name');
                send('rename-layer', { nodeId, name });
                addLog(`Renomeando para "${name}"...`, 'info');
              });
            }
'@

$content = $content -replace [regex]::Escape($oldCardHTML), $newCardHTML

# 2. Fix Copy button functionality
$content = $content -replace "id=`"btn-copy-report`"", "id=`"btn-copy-report`" style=`"display:none`""

# 3. Add Copy button handler
$copyHandler = @'

      // Copy report button handler
      const btnCopyReport = document.getElementById('btn-copy-report');
      if (btnCopyReport) {
        btnCopyReport.addEventListener('click', () => {
          if (currentReport) {
            const reportText = JSON.stringify(currentReport, null, 2);
            navigator.clipboard.writeText(reportText).then(() => {
              addLog('Relatório copiado!', 'success');
            }).catch(() => {
              // Fallback
              const textarea = document.createElement('textarea');
              textarea.value = reportText;
              document.body.appendChild(textarea);
              textarea.select();
              document.execCommand('copy');
              document.body.removeChild(textarea);
              addLog('Relatório copiado!', 'success');
            });
          }
        });
      }
'@

$content = $content -replace '(\s+// Handlers dos botões do painel)', "$copyHandler`r`n`$1"

[IO.File]::WriteAllText($file, $content, [Text.Encoding]::UTF8)
Write-Host "✅ JavaScript updates complete"
