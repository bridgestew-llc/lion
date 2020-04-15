const babel = require('babel-core');
const babelPluginRewriteStoryImports = require('./babelPluginRewriteStoryImports.js');

const storiesExtend = (input, options) =>
  babel.transform(input, {
    plugins: [[babelPluginRewriteStoryImports, { ...options }]],
  });

module.exports = {
  storiesExtend,
};
