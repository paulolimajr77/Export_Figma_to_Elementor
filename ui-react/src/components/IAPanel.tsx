import React from 'react';

export function IAPanel() {
  return (
    <section className="tab-content active">
      <div className="panel">
        <div className="panel-header">Configuração da IA (Gemini)</div>
        <label className="input-label" htmlFor="ai-key">API Key</label>
        <input id="ai-key" type="password" placeholder="Cole sua API Key do Gemini" />
        <button className="btn primary" data-action="test-gemini">Testar conexão</button>
        <div className="status" id="gemini-status"></div>
      </div>
    </section>
  );
}
