import React from 'react';

export function HelpPanel() {
  return (
    <section className="tab-content active">
      <div className="panel">
        <div className="panel-header">Boas práticas</div>
        <ul className="help-list">
          <li>Selecione um frame raiz no Figma antes de gerar.</li>
          <li>Use Auto Layout no Figma para preservar flex-direction.</li>
          <li>Evite agrupar manualmente widgets em colunas; o plugin usa containers flex.</li>
          <li>Preencha API Key do Gemini para validações e prompts mais consistentes.</li>
          <li>Configure WP URL e Token se quiser exportar imagens/página.</li>
          <li>Use “Inspecionar Layout” para checar a árvore antes de gerar.</li>
        </ul>
      </div>
    </section>
  );
}
