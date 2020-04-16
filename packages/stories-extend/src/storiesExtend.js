// Note: this wrapper isn't necessary probably.. but keeping it in case we need to go back to a wrapper, this is how you would run it probably

const babel = require('babel-core');
const babelPluginRewriteStoryImports = require('./babelPluginRewriteStoryImports.js');

const storiesExtend = (input, options) =>
  babel.transform(input, {
    sourceType: 'module',
    plugins: [[babelPluginRewriteStoryImports, { ...options }]],
  });

module.exports = {
  storiesExtend,
};
