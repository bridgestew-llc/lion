const fs = require('fs');

const tagExample = [
  'Should be example:',
  '  {',
  "    from: 'my-counter',",
  "    to: 'my-extension',",
  "    paths: [{ from: './my-counter.js', to: './my-extension/my-extension.js' }],",
  '  }',
];

function validatePaths(paths, given) {
  if (!Array.isArray(paths) || (Array.isArray(paths) && paths.length === 0)) {
    const errorMsg = [
      'babel-plugin-extend-docs: The provided tag change is not valid.',
      'The paths array is missing',
      `Given: ${JSON.stringify(given)}`,
      ...tagExample,
    ].join('\n');
    throw new Error(errorMsg);
  }
}

function validateChanges(changes) {
  if (!Array.isArray(changes) || (Array.isArray(changes) && changes.length === 0)) {
    const errorMsg = [
      'babel-plugin-extend-docs: The required changes array is missing.',
      `Given: ${JSON.stringify(changes)}`,
      ...tagExample,
    ].join('\n');
    throw new Error(errorMsg);
  }
  for (const change of changes) {
    if (change.tag) {
      const { tag } = change;
      const errorMsg = [
        'babel-plugin-extend-docs: The provided tag change is not valid.',
        `Given: ${JSON.stringify(tag)}`,
        ...tagExample,
      ].join('\n');
      if (typeof tag.from !== 'string' || !tag.from) {
        throw new Error(errorMsg);
      }
      if (typeof tag.to !== 'string' || !tag.to) {
        throw new Error(errorMsg);
      }

      validatePaths(tag.paths, tag);
    }
  }
}

function validateOptions(options) {
  // if __filePath is provided directly then we assume you are a test or you know what you are doing
  if (!options.__filePath) {
    if (!options.rootPath) {
      throw new Error(
        `babel-plugin-extend-docs: You need to provide a rootPath option (string)\nExample: rootPath: path.resolve('.')`,
      );
    }
    if (!fs.existsSync(options.rootPath)) {
      throw new Error(
        `babel-plugin-extend-docs: The provided rootPath "${options.rootPath}" does not exist.`,
      );
    }
    if (!fs.lstatSync(options.rootPath).isDirectory()) {
      throw new Error(
        `babel-plugin-extend-docs: The provided rootPath "${options.rootPath}" is not a directory.`,
      );
    }
  }
  validateChanges(options.changes);
}

module.exports = {
  validateOptions,
};
