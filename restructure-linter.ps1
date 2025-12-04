$file = "src\ui.html"
$content = [IO.File]::ReadAllText($file, [Text.Encoding]::UTF8)

# 1. Remove Re-analyze button from actions bar
$content = $content -replace '<button class="btn secondary small" id="btn-reanalyze"[^>]*>[\s\S]*?</button>\s*', ''

# 2. Add educational text at top of Linter panel (after header, before actions bar)
$educationalText = @'
          <!-- Educational Banner -->
          <div class="linter-education-banner" style="background: var(--figma-color-bg-brand-tertiary); border-left: 3px solid var(--figma-color-border-brand); padding: 10px 12px; margin: 12px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 11px; line-height: 1.5; color: var(--figma-color-text-secondary);">
              <strong style="color: var(--figma-color-text);">💡 Por que nomenclatura importa:</strong> Facilita manutenção • Melhora detecção automática • Gera código Elementor mais legível • Reduz erros na exportação
            </p>
          </div>

'@

$content = $content -replace '(\s+<!-- Actions Bar -->)', "$educationalText`$1"

# 3. Simplify educational tip in problem details (remove verbose text)
$content = $content -replace '<div class="problem-tip">[\s\S]*?</div>', ''

# 4. Update renderLinterReport to add buttons to each issue card
# We'll inject this via JavaScript modification

[IO.File]::WriteAllText($file, $content, [Text.Encoding]::UTF8)
Write-Host "✅ UI restructuring complete (HTML)"
