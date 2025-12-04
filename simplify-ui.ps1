$file = "src\ui.html"
$content = [IO.File]::ReadAllText($file, [Text.Encoding]::UTF8)

# 1. Add auto-rename button logic (inject after location div, before tip div)
$content = $content -replace '(\s+<div class="problem-location">[\s\S]+?</div>)\s+(<div class="problem-tip">)', @'
$1

          ${isNamingIssue && suggestedName ? `
            <div style="margin: 12px 0;">
              <button id="btn-auto-rename" class="btn primary small" style="width: 100%;">
                ✨ Renomear para "${suggestedName}"
              </button>
            </div>
          ` : ''}

          $2
'@

# 2. Simplify tip section
$content = $content -replace '<div class="problem-tip">\s+<h4>📚 Por que isso é \$\{issue\.severity === ''critical'' \? ''crítico'' : ''importante''\}\?</h4>\s+<p>\$\{issue\.educational_tip \|\| ''Este problema pode afetar a exportação para o Elementor\.''\}</p>\s+</div>', @'
<div class="problem-tip">
            <p><strong>💡 Dica:</strong> ${issue.educational_tip || 'Corrija para melhorar a exportação.'}</p>
          </div>
'@

# 3. Simplify guide header (remove time and difficulty)
$content = $content -replace '<h4>✅ COMO CORRIGIR \(⏱️ \$\{guide\.estimated_time\}\):</h4>', '<h4>✅ Como Corrigir:</h4>'
$content = $content -replace '<div class="difficulty-badge \$\{guide\.difficulty\}">[\s\S]+?Dificuldade: \$\{getDifficultyLabel\(guide\.difficulty\)\}[\s\S]+?</div>', ''

# 4. Simplify guide steps
$content = $content -replace '''auto-layout-required'': \{[\s\S]+?steps: \[[\s\S]+?\],[\s\S]+?estimated_time:[\s\S]+?difficulty:[\s\S]+?\}', @"
'auto-layout-required': {
            steps: [
              'Selecione o frame',
              'Pressione Shift + A',
              'Configure direção e espaçamento'
            ]
          }
"@

$content = $content -replace '''spacer-detected'': \{[\s\S]+?steps: \[[\s\S]+?\],[\s\S]+?estimated_time:[\s\S]+?difficulty:[\s\S]+?\}', @"
'spacer-detected': {
            steps: [
              'Selecione o frame pai',
              'Aumente o Gap',
              'Delete o spacer'
            ]
          }
"@

$content = $content -replace '''generic-name-detected'': \{[\s\S]+?steps: \[[\s\S]+?\],[\s\S]+?estimated_time:[\s\S]+?difficulty:[\s\S]+?\}', @"
'generic-name-detected': {
            steps: [
              'Use o botão "Renomear" acima',
              'Ou clique 2x no nome da camada'
            ]
          }
"@

$content = $content -replace '''widget-naming'': \{[\s\S]+?steps: \[[\s\S]+?\],[\s\S]+?estimated_time:[\s\S]+?difficulty:[\s\S]+?\}', @"
'widget-naming': {
            steps: [
              'Use o botão "Renomear" acima',
              'Ou clique 2x no nome da camada'
            ]
          }
"@

# 5. Simplify default guide
$content = $content -replace 'return guides\[ruleId\] \|\| \{[\s\S]+?steps: \[''Corrija o problema manualmente no Figma''\],[\s\S]+?estimated_time:[\s\S]+?difficulty:[\s\S]+?\};', @'
return guides[ruleId] || {
          steps: ['Corrija manualmente no Figma']
        };
'@

[IO.File]::WriteAllText($file, $content, [Text.Encoding]::UTF8)
Write-Host "UI simplification complete"
