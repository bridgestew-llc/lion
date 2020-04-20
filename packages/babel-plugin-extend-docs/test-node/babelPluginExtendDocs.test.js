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

pluginTester({
  plugin: babelPluginExtendDocs,
  pluginName: 'ExtendDocs',
  pluginOptions: {
    ...baseConfig,
    filePath: '/node_module/@lion/input/README.md',
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
        filePath: '/node_module/@lion/input/docs/README.md',
      },
    },
    'replaces local src class imports (3)': {
      code: `import { LionInput as Foo } from './src/LionInput.js';`,
      output: `import { WolfInput as Foo } from '../../../index.js';`,
    },
    'replaces local src class imports (4)': {
      skip: true, // TODO: Handle this edge case
      code: `import someDefaultHelper, { LionInput, someHelper } from './src/LionInput.js';`,
      output: `
        import { WolfInput } from '../../../index.js';
        import someDefaultHelper, { someHelper } from './src/LionInput.js';
      `,
    },
    'replaces local src class imports (5)': {
      skip: true, // TODO: Handle this edge case
      code: `import { LionInput, LionFoo, LionBar, someHelper } from '@lion/foo';`,
      output: `
        import { WolfFoo, WolfBar } from '../../../index.js';
        import { WolfBaz } from '../../../somewhere-else.js';
        import { someHelper } from '@lion/foo';
      `,
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
        filePath: '/node_module/@lion/input/docs/README.md',
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

    'replaces tags in function occurrences': {
      code: `
        export const main = () => html\`
          <lion-input label="First Name"></lion-input>
        \`;
      `,
      /* Babel for some reason removes the new line here */
      output: `
        export const main = () => html\` <wolf-input label="First Name"></wolf-input> \`;
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
// TODO: Test more edge cases
