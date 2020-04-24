const { expect } = require('chai');
const babel = require('babel-core');
const path = require('path');
const babelPluginExtendDocs = require('../src/babelPluginExtendDocs.js');

const baseConfig = {
  changes: [
    {
      description: 'LionInput',
      variable: {
        from: 'LionInput',
        to: 'WolfInput',
        paths: [
          {
            from: './index.js',
            to: './index.js',
          },
          {
            from: './src/LionInput.js',
            to: './index.js',
          },
          {
            from: '@lion/input',
            to: './index.js',
          },
        ],
      },
      tag: {
        from: 'lion-input',
        to: 'wolf-input',
        paths: [
          {
            from: './lion-input.js',
            to: './__element-definitions/wolf-input.js',
          },
          {
            from: '@lion/input/lion-input.js',
            to: './__element-definitions/wolf-input.js',
          },
        ],
      },
    },
    {
      description: 'LionButton',
      variable: {
        from: 'LionButton',
        to: 'WolfButton',
        paths: [
          {
            from: './index.js',
            to: './index.js',
          },
          {
            from: './src/LionButton.js',
            to: './index.js',
          },
          {
            from: '@lion/button',
            to: './index.js',
          },
        ],
      },
      tag: {
        from: 'lion-button',
        to: 'wolf-button',
        paths: [
          {
            from: './lion-button.js',
            to: './__element-definitions/wolf-button.js',
          },
          {
            from: '@lion/button/lion-button.js',
            to: './__element-definitions/wolf-button.js',
          },
        ],
      },
    },
    {
      description: 'localize',
      variable: {
        from: 'localize',
        to: 'localize',
        paths: [
          {
            from: './index.js',
            to: './localize.js',
          },
          {
            from: './src/localize.js',
            to: './localize.js',
          },
          {
            from: '@lion/localize',
            to: './localize.js',
          },
        ],
      },
    },
  ],
};

const testConfig = {
  ...baseConfig,
  __filePath: '/node_module/@lion/input/README.md',
};

function executeBabel(input, options) {
  const result = babel.transform(input, {
    plugins: [[babelPluginExtendDocs, options]],
  });
  return result.code;
}

describe('babel-plugin-extend-docs', () => {
  it('throws if no rootPath string is provided', () => {
    expect(() => executeBabel('', { ...baseConfig })).to.throw(
      `babel-plugin-extend-docs: You need to provide a rootPath option (string)\nExample: rootPath: path.resolve('.')`,
    );
  });

  it('throws if rootPath does not exist', () => {
    expect(() => executeBabel('', { ...baseConfig, rootPath: 'something' })).to.throw(
      `babel-plugin-extend-docs: The provided rootPath "something" does not exist.`,
    );
  });

  it('throws if rootPath is not a directory', () => {
    const rootPath = path.resolve('./index.js');
    expect(() => {
      executeBabel('', {
        ...baseConfig,
        rootPath,
      });
    }).to.throw(
      `babel-plugin-extend-docs: The provided rootPath "${rootPath}" is not a directory.`,
    );
  });

  it('throws if no changes array is provided', () => {
    expect(() => {
      executeBabel('', {
        rootPath: path.resolve('./'),
      });
    }).to.throw(
      'babel-plugin-extend-docs: You need to provide a changes array (string)\nExample: changes: [...]',
    );
  });

  it('throws if tag does not have a valid to, from, and paths property', () => {
    function tagThrowsErrorFor(tag) {
      expect(() => {
        executeBabel('', {
          rootPath: path.resolve('./'),
          changes: [{ tag }],
        });
      }).to.throw(
        [
          'babel-plugin-extend-docs: The provided tag change is not valid.',
          `Given: ${JSON.stringify(tag)}`,
          'Should be example:',
          '  {',
          "    from: 'my-counter',",
          "    to: 'my-extension',",
          "    paths: [{ from: './my-counter.js', to: './my-extension/my-extension.js' }],",
          '  }',
        ].join('\n'),
      );
    }

    tagThrowsErrorFor({});
    tagThrowsErrorFor({ from: '' });
    tagThrowsErrorFor({ from: 'my-counter' });
    tagThrowsErrorFor({ from: 'my-counter', to: '' });
    // tagThrowsErrorFor({ from: 'my-counter', to: 'my-extension' });
  });

  it('replaces local src class imports (1)', () => {
    const code = `import { LionInput } from './src/LionInput.js';`;
    const output = `import { WolfInput } from "../../../index.js";`;
    expect(executeBabel(code, testConfig)).to.equal(output);
  });

  it('replaces local src class imports (2)', () => {
    const code = `import { LionInput } from './src/LionInput.js';`;
    const output = `import { WolfInput } from "../../../../index.js";`;
    const config = {
      ...testConfig,
      __filePath: '/node_module/@lion/input/docs/README.md',
    };
    expect(executeBabel(code, config)).to.equal(output);
  });

  it('replaces local src class imports (3)', () => {
    const code = `import { LionInput as Foo } from './src/LionInput.js';`;
    const output = `import { WolfInput as Foo } from "../../../index.js";`;
    expect(executeBabel(code, testConfig)).to.equal(output);
  });

  it('replaces local src class imports (4)', () => {
    const code = `
      import someDefaultHelper, { LionInput, someHelper } from './src/LionInput.js';
      import { LionButton } from '@lion/button';
    `;
    const output = [
      `import someDefaultHelper, { someHelper } from "./src/LionInput.js";`,
      `import { WolfInput, WolfButton } from "../../../index.js";`,
    ].join('\n');
    expect(executeBabel(code, testConfig)).to.equal(output);
  });

  it('replaces local src class imports (5)', () => {
    const code = `import { LionInput, LionFoo, LionBar, someHelper } from '@lion/input';`;
    const output = [
      `import { WolfInput, WolfFoo } from "../../../index.js";`,
      `import { WolfBar } from "../../../somewhere-else.js";`,
      `import { someHelper } from "@lion/input";`,
    ].join('\n');
    const config = {
      ...testConfig,
      changes: [
        ...baseConfig.changes,
        {
          description: 'LionFoo',
          variable: {
            from: 'LionFoo',
            to: 'WolfFoo',
            paths: [
              {
                from: '@lion/input',
                to: './index.js',
              },
            ],
          },
        },
        {
          description: 'LionBar',
          variable: {
            from: 'LionBar',
            to: 'WolfBar',
            paths: [
              {
                from: '@lion/input',
                to: './somewhere-else.js',
              },
            ],
          },
        },
      ],
      __filePath: '/node_module/@lion/input/README.md',
    };
    expect(executeBabel(code, config)).to.equal(output);
  });

  it('replaces local src class imports (6)', () => {
    const code = `
      import { localize } from '@lion/localize';
      import { LionInput } from '@lion/input';
    `;
    const output = [
      `import { localize } from "../../../localize.js";`,
      `import { WolfInput } from "../../../index.js";`,
    ].join('\n');
    expect(executeBabel(code, testConfig)).to.equal(output);
  });

  it('allows separate import paths of managed imports', () => {
    const code1 = `import { LionInput } from '@lion/input';`;
    const code2 = `import { LionInput } from './src/LionInput.js';`;
    const output1 = `import { WolfInput } from "../../../fork/LionInput.js";`;
    const output2 = `import { WolfInput } from "../../../index.js";`;
    const config = {
      ...testConfig,
      changes: [
        {
          description: 'LionInput',
          variable: {
            from: 'LionInput',
            to: 'WolfInput',
            paths: [
              {
                from: '@lion/input',
                to: './fork/LionInput.js',
              },
              {
                from: './src/LionInput.js',
                to: './index.js',
              },
            ],
          },
        },
      ],
      __filePath: '/node_module/@lion/input/README.md',
    };
    expect(executeBabel(code1, config)).to.equal(output1);
    expect(executeBabel(code2, config)).to.equal(output2);
  });

  it('replaces local index.js class imports (1)', () => {
    const code = `import { LionInput } from './index.js';`;
    const output = `import { WolfInput } from "../../../index.js";`;
    expect(executeBabel(code, testConfig)).to.equal(output);
  });

  it('replaces local index.js class imports (2)', () => {
    const code = `import { LionInput } from './index.js';`;
    const output = `import { WolfInput } from "../../../../index.js";`;
    const config = {
      ...testConfig,
      __filePath: '/node_module/@lion/input/docs/README.md',
    };
    expect(executeBabel(code, config)).to.equal(output);
  });

  it('works with local index.js class imports with an empty relative path', () => {
    const code = `import { LionInput } from './index.js';`;
    const output = `import { WolfInput } from "./index.js";`;
    const config = {
      ...testConfig,
      __filePath: './README.md',
    };
    expect(executeBabel(code, config)).to.equal(output);
  });

  it('replaces `@lion` class imports', () => {
    const code = `import { LionInput } from '@lion/input';`;
    const output = `import { WolfInput } from "../../../index.js";`;
    expect(executeBabel(code, testConfig)).to.equal(output);
  });

  it('does NOT replace imports no in the config', () => {
    const code = `import { FooInput } from '@lion/input';`;
    const output = `import { FooInput } from "@lion/input";`;
    expect(executeBabel(code, testConfig)).to.equal(output);
  });

  it('replaces local tag imports', () => {
    const code = `import './lion-input.js';`;
    const output = `import "../../../__element-definitions/wolf-input.js";`;
    expect(executeBabel(code, testConfig)).to.equal(output);
  });

  it('replaces `@lion` tag imports', () => {
    const code = `import '@lion/input/lion-input.js';`;
    const output = `import "../../../__element-definitions/wolf-input.js";`;
    expect(executeBabel(code, testConfig)).to.equal(output);
  });

  it("doesn't care about namespace imports", () => {
    const code = `import * as all from '@lion/input';`;
    const output = `import * as all from "@lion/input";`;
    expect(executeBabel(code, testConfig)).to.equal(output);
  });

  it('replaces tags in function occurrences', () => {
    const code = [
      'export const main = () => html`',
      `  <lion-input \${'hi'} label="First Name"></lion-input>`,
      '`;',
    ].join('\n');
    const output = [
      'export const main = () => html`',
      `  <wolf-input \${'hi'} label="First Name"></wolf-input>`,
      '`;',
    ].join('\n');
    expect(executeBabel(code, testConfig)).to.equal(output);
  });

  it('replaces nested tags in function occurrences', () => {
    const code = [
      'export const main = () => html`',
      '  <lion-input label="First Name">',
      '    ${html`',
      '      <lion-button></lion-button>',
      '    `}',
      '  </lion-input>',
      '`;',
    ].join('\n');
    const output = [
      'export const main = () => html`',
      '  <wolf-input label="First Name">',
      '    ${html`',
      '      <wolf-button></wolf-button>',
      '    `}',
      '  </wolf-input>',
      '`;',
    ].join('\n');
    expect(executeBabel(code, testConfig)).to.equal(output);
  });

  it('replaces tags in classes occurrences', () => {
    const code = [
      'class Foo extends LitElement {',
      '  render() {',
      '    return html`',
      '      <lion-input some-attribute>',
      '        <p>light dom</p>',
      '        <lion-input></lion-input>',
      '      </lion-input>',
      '    `;',
      '  }',
      '}',
    ].join('\n');
    const output = [
      'class Foo extends LitElement {',
      '  render() {',
      '    return html`',
      '      <wolf-input some-attribute>',
      '        <p>light dom</p>',
      '        <wolf-input></wolf-input>',
      '      </wolf-input>',
      '    `;',
      '  }',
      '', // babel puts an empty line here?
      '}',
    ].join('\n');
    expect(executeBabel(code, testConfig)).to.equal(output);
  });
});
