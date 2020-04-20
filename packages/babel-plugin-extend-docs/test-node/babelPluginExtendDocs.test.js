const pluginTester = require('babel-plugin-tester').default;
const babelPluginExtendDocs = require('../src/babelPluginExtendDocs.js');

const baseConfig = {
  changes: [
    {
      name: 'LionInput',
      variable: {
        from: 'LionInput',
        to: 'WoofInput',
        fromPaths: ['index.js', 'src/LionInput.js', '@lion/input'],
        toPath: 'index.js',
      },
      tag: {
        from: 'lion-input',
        to: 'woof-input',
        fromPaths: ['lion-input.js', '@lion/input/lion-input.js'],
        toPath: '__element-definitions/woof-input.js',
      },
    },
  ],
};

pluginTester({
  plugin: babelPluginExtendDocs,
  pluginName: 'ExtendDocs',
  pluginOptions: {
    ...baseConfig,
    filePath: '/node_module/@lion/input/README.md',
    rootPath: '/node_module/@lion/input/',
  },
  snapshot: false,
  tests: {
    'replaces local src class imports (1)': {
      code: `import { LionInput } from './src/LionInput.js';`,
      output: `import { WoofInput } from '../../../index.js';`,
    },
    'replaces local src class imports (2)': {
      code: `import { LionInput } from './src/LionInput.js';`,
      output: `import { WoofInput } from '../../../../index.js';`,
      pluginOptions: {
        ...baseConfig,
        filePath: '/node_module/@lion/input/docs/README.md',
      },
    },
    'replaces local src class imports (3)': {
      code: `import { LionInput as Foo } from './src/LionInput.js';`,
      output: `import { WoofInput as Foo } from '../../../index.js';`,
    },
    'replaces local src class imports (4)': {
      skip: true, // TODO: Handle this edge case
      code: `import { LionInput, someHelper } from './src/LionInput.js';`,
      output: `
        import { WoofInput } from '../../../index.js';
        import { someHelper } from './src/LionInput.js';
      `,
    },
    'replaces local index.js class imports (1)': {
      code: `import { LionInput } from './index.js';`,
      output: `import { WoofInput } from '../../../index.js';`,
    },
    'replaces local index.js class imports (2)': {
      code: `import { LionInput } from './index.js';`,
      output: `import { WoofInput } from '../../../../index.js';`,
      pluginOptions: {
        ...baseConfig,
        filePath: '/node_module/@lion/input/docs/README.md',
      },
    },
    'replaces `@lion` class imports': {
      code: `import { LionInput } from '@lion/input';`,
      output: `import { WoofInput } from '../../../index.js';`,
    },
    'does NOT replace imports that do not start with Lion': {
      code: `import { FooInput } from '@lion/input';`,
      output: `import { FooInput } from '@lion/input';`,
    },

    'replaces local tag imports': {
      code: `import './lion-input.js';`,
      output: `import '../../../__element-definitions/woof-input.js';`,
    },
    'replaces `@lion` tag imports': {
      code: `import '@lion/input/lion-input.js';`,
      output: `import '../../../__element-definitions/woof-input.js';`,
    },

    'replaces tags in function occurrences': {
      code: `
        export const main = () => html\`
          <lion-input label="First Name"></lion-input>
        \`;
      `,
      /* Babel for some reason removes the new line here */
      output: `
        export const main = () => html\` <woof-input label="First Name"></woof-input> \`;
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
              <woof-input some-attribute>
                <p>light dom</p>
                <woof-input></woof-input>
              </woof-input>
            \`;
          }
        }
      `,
    },
  },
});
// TODO: Test more edge cases
