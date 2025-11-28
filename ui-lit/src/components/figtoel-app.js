import { LitElement, html, css } from 'lit';
import './figtoel-tabs.js';

export class FigToElApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 850px;
      margin: 0 auto;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: var(--color-text, #222);
    }
    .panel {
      background: var(--color-panel, #fff);
      border: 1px solid var(--color-border, #ddd);
      border-radius: var(--color-radius, 6px);
      padding: 16px;
      margin-bottom: 16px;
    }
  `;

  render() {
    return html`
      <figtoel-tabs></figtoel-tabs>
    `;
  }
}

customElements.define('figtoel-app', FigToElApp);
