import { LitElement, html } from 'lit-element';

import './my-counter.js';

class MyApp extends LitElement {
  render() {
    return html`
      <h1>Example App</h1>
      <hr />
      <my-counter></my-counter>
    `;
  }
}

customElements.define('my-app', MyApp);
