import { LitElement, html } from 'lit-element';
import './my-counter.js';

// TODO: fix renames of imports
// import { MyCounter } from './src/MyCounter.js';
// class TenCounter extends MyCounter {
//   inc() {
//     this.count += 10;
//   }
// }
// customElements.define('ten-counter', TenCounter);

class MyApp extends LitElement {
  render() {
    return html`
      <h1>Example App</h1>
      <hr />
      <my-counter></my-counter>
      <hr />
      <ten-counter></ten-counter>
    `;
  }
}

customElements.define('my-app', MyApp);
