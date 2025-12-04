$file = "src\ui.html"
$content = [IO.File]::ReadAllText($file, [Text.Encoding]::UTF8)

# Add CSS for problem details panel (insert before closing </style>)
$newCSS = @'

    /* ========== PROBLEM DETAILS PANEL STYLES ========== */
    .problem-details-panel {
      background: var(--figma-color-bg-secondary);
      border: 1px solid var(--figma-color-border);
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--figma-color-border);
    }

    .panel-header h3 {
      font-size: 13px;
      font-weight: 600;
      margin: 0;
      color: var(--figma-color-text);
    }

    .panel-content {
      font-size: 11px;
      line-height: 1.5;
    }

    .problem-header {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }

    .problem-severity {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 4px;
      width: fit-content;
    }

    .problem-severity.critical {
      background: #fadbd8;
      color: #c0392b;
    }

    .problem-severity.major {
      background: #fcf3cf;
      color: #d68910;
    }

    .problem-severity.minor {
      background: #d6eaf8;
      color: #2980b9;
    }

    .problem-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--figma-color-text);
      line-height: 1.4;
    }

    .problem-location {
      font-size: 10px;
      color: var(--figma-color-text-secondary);
      padding: 6px 0;
      border-bottom: 1px solid var(--figma-color-border);
      margin-bottom: 12px;
    }

    .problem-tip {
      background: var(--figma-color-bg);
      border-left: 3px solid var(--figma-color-border-brand);
      padding: 8px 10px;
      margin: 12px 0;
      border-radius: 4px;
    }

    .problem-tip p {
      margin: 0;
      font-size: 11px;
      line-height: 1.4;
      color: var(--figma-color-text-secondary);
    }

    .problem-tip strong {
      color: var(--figma-color-text);
    }

    .problem-guide {
      margin-top: 12px;
    }

    .problem-guide h4 {
      font-size: 11px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--figma-color-text);
    }

    .guide-steps {
      margin: 0;
      padding-left: 20px;
      list-style: none;
      counter-reset: step-counter;
    }

    .guide-steps li {
      counter-increment: step-counter;
      margin-bottom: 6px;
      font-size: 11px;
      line-height: 1.4;
      color: var(--figma-color-text-secondary);
      position: relative;
    }

    .guide-steps li::before {
      content: counter(step-counter);
      position: absolute;
      left: -20px;
      top: 0;
      width: 16px;
      height: 16px;
      background: var(--figma-color-bg-brand);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 600;
    }

    .panel-actions {
      display: flex;
      gap: 6px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--figma-color-border);
    }

    .panel-actions .btn {
      flex: 1;
      font-size: 11px;
      padding: 6px 10px;
    }
'@

$content = $content -replace '(\s+)</style>', "$newCSS`r`n`$1</style>"

[IO.File]::WriteAllText($file, $content, [Text.Encoding]::UTF8)
Write-Host "CSS styles added successfully"
