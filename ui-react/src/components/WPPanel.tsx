import React from 'react';

export function WPPanel() {
  return (
    <section className="tab-content active">
      <div className="panel">
        <div className="panel-header">WordPress</div>
        <label className="input-label" htmlFor="wp-url">WP URL</label>
        <input id="wp-url" type="text" placeholder="https://site.com" />

        <label className="input-label" htmlFor="wp-token">WP Token</label>
        <input id="wp-token" type="text" placeholder="Token ou Basic Auth" />

        <label className="checkbox">
          <input id="chk-export-images" type="checkbox" defaultChecked />
          <span>Exportar imagens</span>
        </label>
        <label className="checkbox">
          <input id="chk-create-page" type="checkbox" />
          <span>Criar página automaticamente</span>
        </label>

        <div className="actions-row">
          <button className="btn primary" data-action="test-wp">Testar WP</button>
          <button className="btn secondary" data-action="export-wp">Exportar WP</button>
        </div>
        <div className="status" id="wp-status"></div>
      </div>
    </section>
  );
}
