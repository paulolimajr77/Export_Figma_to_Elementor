import React from 'react';

export function LayoutPanel() {
  return (
    <section className="tab-content active">
      <div className="panel">
        <div className="panel-header">Ações rápidas</div>
        <div className="actions-grid">
          <button className="btn primary" data-action="inspect">Inspecionar Layout</button>
          <button className="btn primary" data-action="generate-json">Gerar JSON Elementor</button>
          <button className="btn" data-action="copy-json">Copiar JSON</button>
          <button className="btn" data-action="download-json">Baixar JSON</button>
          <button className="btn secondary" data-action="export-wp">Exportar WP</button>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">Saída / Logs</div>
        <textarea readOnly placeholder="O JSON gerado aparecerá aqui" />
        <div className="logs"></div>
      </div>
    </section>
  );
}
