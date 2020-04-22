const { expect } = require('chai');
const babel = require('babel-core');
const path = require('path');
const pluginTester = require('babel-plugin-tester').default;
const babelPluginExtendDocs = require('../src/babelPluginExtendDocs.js');

const baseConfig = {
  changes: [
    {
      name: 'LionInput',
      variable: {
        from: 'LionInput',
        to: 'WolfInput',
        fromPaths: ['index.js', 'src/LionInput.js', '@lion/input'],
        toPath: 'index.js',
      },
      tag: {
        from: 'lion-input',
        to: 'wolf-input',
        fromPaths: ['lion-input.js', '@lion/input/lion-input.js'],
        toPath: '__element-definitions/wolf-input.js',
      },
    },
    {
      name: 'LionButton',
      variable: {
        from: 'LionButton',
        to: 'WolfButton',
        fromPaths: ['index.js', 'src/LionButton.js', '@lion/button'],
        toPath: 'index.js',
      },
      tag: {
        from: 'lion-button',
        to: 'wolf-button',
        fromPaths: ['lion-button.js', '@lion/button/lion-button.js'],
        toPath: '__element-definitions/wolf-button.js',
      },
    },
    {
      name: 'localize',
      variable: {
        from: 'localize',
        to: 'localize',
        fromPaths: ['index.js', 'src/localize.js', '@lion/localize'],
        toPath: 'localize.js',
      },
    },
  ],
};

function executeBabel(input, options) {
  babel.transform(input, {
    plugins: [[babelPluginExtendDocs, options]],
  });
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
});

pluginTester({
  plugin: babelPluginExtendDocs,
  pluginName: 'babel-plugin-extend-docs',
  pluginOptions: {
    ...baseConfig,
    __filePath: '/node_module/@lion/input/README.md',
  },
  snapshot: false,
  tests: {
    'replaces local src class imports (1)': {
      code: `import { LionInput } from './src/LionInput.js';`,
      output: `import { WolfInput } from '../../../index.js';`,
    },
    'replaces local src class imports (2)': {
      code: `import { LionInput } from './src/LionInput.js';`,
      output: `import { WolfInput } from '../../../../index.js';`,
      pluginOptions: {
        ...baseConfig,
        __filePath: '/node_module/@lion/input/docs/README.md',
      },
    },
    'replaces local src class imports (3)': {
      code: `import { LionInput as Foo } from './src/LionInput.js';`,
      output: `import { WolfInput as Foo } from '../../../index.js';`,
    },
    'replaces local src class imports (4)': {
      code: `
        import someDefaultHelper, { LionInput, someHelper } from './src/LionInput.js';
        import { LionButton } from '@lion/button';
      `,
      output: `
        import { WolfInput, WolfButton } from '../../../index.js';
        import someDefaultHelper, { someHelper } from './src/LionInput.js';
      `,
    },
    'replaces local src class imports (5)': {
      code: `import { LionInput, LionFoo, LionBar, someHelper } from '@lion/input';`,
      output: `
        import { WolfInput, WolfFoo } from '../../../index.js';
        import { WolfBar } from '../../../somewhere-else.js';
        import { someHelper } from '@lion/input';
      `,
      pluginOptions: {
        changes: [
          ...baseConfig.changes,
          {
            name: 'LionFoo',
            variable: {
              from: 'LionFoo',
              to: 'WolfFoo',
              fromPaths: ['@lion/input'],
              toPath: 'index.js',
            },
          },
          {
            name: 'LionBar',
            variable: {
              from: 'LionBar',
              to: 'WolfBar',
              fromPaths: ['@lion/input'],
              toPath: 'somewhere-else.js',
            },
          },
        ],
        __filePath: '/node_module/@lion/input/README.md',
      },
    },
    'replaces local src class imports (6)': {
      code: `
        import { localize } from '@lion/localize';
        import { LionInput } from '@lion/input';
      `,
      output: `
        import { localize } from '../../../localize.js';
        import { WolfInput } from '../../../index.js';
      `,
    },
    'replaces local index.js class imports (1)': {
      code: `import { LionInput } from './index.js';`,
      output: `import { WolfInput } from '../../../index.js';`,
    },
    'replaces local index.js class imports (2)': {
      code: `import { LionInput } from './index.js';`,
      output: `import { WolfInput } from '../../../../index.js';`,
      pluginOptions: {
        ...baseConfig,
        __filePath: '/node_module/@lion/input/docs/README.md',
      },
    },
    'replaces `@lion` class imports': {
      code: `import { LionInput } from '@lion/input';`,
      output: `import { WolfInput } from '../../../index.js';`,
    },
    'does NOT replace imports that do not start with Lion': {
      code: `import { FooInput } from '@lion/input';`,
      output: `import { FooInput } from '@lion/input';`,
    },

    'replaces local tag imports': {
      code: `import './lion-input.js';`,
      output: `import '../../../__element-definitions/wolf-input.js';`,
    },
    'replaces `@lion` tag imports': {
      code: `import '@lion/input/lion-input.js';`,
      output: `import '../../../__element-definitions/wolf-input.js';`,
    },
    "doesn't care about namespace imports": {
      code: `import * as all from '@lion/input';`,
      output: `import * as all from '@lion/input';`,
    },

    'replaces tags in function occurrences': {
      code: `
        export const main = () => html\`
          <lion-input \${'hi'} label="First Name"></lion-input>
        \`;
      `,
      /* Babel for some reason removes the new line here */
      output: `
        export const main = () => html\` <wolf-input \${'hi'} label="First Name"></wolf-input> \`;
      `,
    },
    'replaces nested tags in function occurrences': {
      code: `
        export const main = () => html\`
          <lion-input label="First Name">
            \${html\`
              <lion-button></lion-button>
            \`}
          </lion-input>
        \`;
      `,
      // sometimes babel removes the newline to a space..
      output: `
        export const main = () => html\`
          <wolf-input label="First Name">
            \${html\` <wolf-button></wolf-button> \`}
          </wolf-input>
        \`;
      `,
    },

    'replaces tags in classes occurrences': {
      code: `
        class Foo extends LitElement {
          render() {
            return html\`
              <lion-input some-attribute>
                <p>light dom</p>
                <lion-input></lion-input>
              </lion-input>
            \`;
          }
        }
      `,
      output: `
        class Foo extends LitElement {
          render() {
            return html\`
              <wolf-input some-attribute>
                <p>light dom</p>
                <wolf-input></wolf-input>
              </wolf-input>
            \`;
          }
        }
      `,
    },
  },
});
