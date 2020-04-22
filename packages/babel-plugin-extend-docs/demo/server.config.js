const path = require('path');

const extendDocsConfig = {
  changes: [
    {
      name: 'MyCounter',
      variable: {
        from: 'MyCounter',
        to: 'MyExtension',
        fromPaths: ['index.js', 'src/MyCounter.js'],
        toPath: './my-extension/index.js',
      },
      tag: {
        from: 'my-counter',
        to: 'my-extension',
        fromPaths: ['my-counter.js'],
        toPath: './my-extension/my-extension.js',
      },
    },
  ],
  rootPath: path.resolve('./demo'),
};

module.exports = {
  nodeResolve: true,
  watch: true,
  open: 'packages/babel-plugin-extend-docs/demo/',
  babel: true,
  babelConfig: {
    overrides: [
      {
        test: './demo/my-app.js',
        plugins: [[path.resolve('./'), extendDocsConfig]],
      },
    ],
  },
};
