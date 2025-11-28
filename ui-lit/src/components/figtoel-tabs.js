import { LitElement, html, css } from 'lit';

export class FigToElTabs extends LitElement {
  static properties = {
    active: { type: String }
  };

  constructor() {
    super();
    this.active = 'layout';
  }

  static styles = css`
    :host {
      display: block;
      border: 1px solid var(--color-border, #ddd);
      background: var(--color-panel, #fff);
      border-radius: var(--color-radius, 6px);
      padding: 8px;
    }
    .tabs {
      display: flex;
      border-bottom: 1px solid var(--color-border, #ddd);
    }
    button {
      flex: 1;
      padding: 10px;
      border: none;
      background: none;
      font-weight: 600;
      color: var(--color-text-secondary, #666);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: 160ms;
    }
    button.active {
      color: var(--color-primary, #007aff);
      border-bottom-color: var(--color-primary, #007aff);
    }
    .content {
      padding: 12px 6px;
    }
  `;

  setTab(tab) {
    this.active = tab;
  }

  render() {
    return html`
      <div class="tabs">
        <button class=${this.active === 'layout' ? 'active' : ''} @click=${() => this.setTab('layout')}>Layout → Elementor</button>
        <button class=${this.active === 'ai' ? 'active' : ''} @click=${() => this.setTab('ai')}>Configuração da IA</button>
        <button class=${this.active === 'wp' ? 'active' : ''} @click=${() => this.setTab('wp')}>WordPress</button>
        <button class=${this.active === 'help' ? 'active' : ''} @click=${() => this.setTab('help')}>Ajuda</button>
      </div>
      <div class="content">
        ${this.active === 'layout' ? html`<p>Ações de layout aqui.</p>` : ''}
        ${this.active === 'ai' ? html`<p>Configuração de IA.</p>` : ''}
        ${this.active === 'wp' ? html`<p>Configuração WP.</p>` : ''}
        ${this.active === 'help' ? html`<p>Boas práticas.</p>` : ''}
      </div>
    `;
  }
}

customElements.define('figtoel-tabs', FigToElTabs);
