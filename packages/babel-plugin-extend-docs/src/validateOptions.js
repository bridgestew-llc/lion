const fs = require('fs');

function validateChanges(changes) {
  for (const change of changes) {
    if (change.tag) {
      const tagExample = [
        'Should be example:',
        '  {',
        "    from: 'my-counter',",
        "    to: 'my-extension',",
        "    paths: [{ from: './my-counter.js', to: './my-extension/my-extension.js' }],",
        '  }',
      ];

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
  if (!options.changes) {
    throw new Error(
      `babel-plugin-extend-docs: You need to provide a changes array (string)\nExample: changes: [...]`,
    );
  }

  validateChanges(options.changes);
}

module.exports = {
  validateOptions,
};
