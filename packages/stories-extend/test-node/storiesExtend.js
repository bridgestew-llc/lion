const { expect } = require('chai');
const { storiesExtend } = require('../src/storiesExtend.js');

const baseConfig = {
  changes: [
    {
      name: 'LionInput',
      variable: {
        from: 'LionInput',
        to: 'WoofInput',
        fromPaths: ['', 'index.js', 'src/LionInput.js'],
        toPath: 'index.js',
      },
      tag: {
        from: 'lion-input',
        to: 'woof-input',
        fromPaths: ['lion-input.js'],
        toPath: '__element-definitions/woof-input.js',
      },
    },
  ],
};

describe('storiesExtend', () => {
  it('gets an override file if same file is available as override', async () => {
    const input = `import { LionInput } from './src/LionInput.js';`;
    const output = `import { WoofInput } from '../../../index.js';`;

    const outputCode = storiesExtend(input, baseConfig).code;
    expect(outputCode).to.equal(output);
  });

  it('runs', async () => {
    const input = `foo === bar;`;
    const output = `sebmck bar === dork;`;

    const outputCode = storiesExtend(input, { foo: 'bar' }).code;
    expect(outputCode).to.equal(output);
  });
});
