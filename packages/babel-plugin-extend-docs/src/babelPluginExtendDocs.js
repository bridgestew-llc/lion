/* eslint-disable no-param-reassign */
const fs = require('fs');
const pathModule = require('path');

// -1 because filepath is an absolute path starting with '/' and we turn it into a relative path without a '/' at the start
const getFolderDepth = filePath => [...filePath.match(new RegExp('/', 'g'))].length - 1;

function getImportAs(specifier, newImportName) {
  if (specifier.local && specifier.local.name && specifier.local.name !== specifier.imported.name) {
    return specifier.local.name;
  }
  return newImportName;
}

/**
 * Example: import someDefaultHelper, { LionInput, someHelper } from './src/LionInput.js';
 * We should filter out the imports that we need to replace and store for now (LionInput).
 * Then in the exit step, we can create the necessary new imports and insert them
 */
const detectImported = ({ path, state, opts, types: t }) => {
  for (const specifier of path.node.specifiers) {
    let managed = false;
    if (t.isIdentifier(specifier.imported) && specifier.type === 'ImportSpecifier') {
      for (const change of opts.changes) {
        if (specifier.imported.name === change.variable.from) {
          for (const { from, to } of change.variable.paths) {
            if (from === path.node.source.value) {
              const relativePart = '../'.repeat(getFolderDepth(state.filePath));
              const importAs = getImportAs(specifier, change.variable.to);

              state.importedStorage.push({
                action: 'change',
                specifier: t.importSpecifier(
                  t.identifier(importAs),
                  t.identifier(change.variable.to),
                ),
                path: pathModule.join(relativePart, to),
              });
              managed = true;
            }
          }
        }
      }
    }

    if (managed === false) {
      state.importedStorage.push({
        action: 'keep',
        specifier,
        path: path.node.source.value,
      });
    }
  }
  path.remove();
};

const generateImportStatements = ({ state, types: t }) => {
  const statements = {};
  for (const imp of state.importedStorage) {
    if (!statements[imp.path]) {
      statements[imp.path] = [];
    }
    statements[imp.path].push(imp.specifier);
  }
  const res = [];
  for (const path of Object.keys(statements)) {
    const importSpecifiers = statements[path];
    const source = t.stringLiteral(path);
    res.push(t.importDeclaration(importSpecifiers, source));
  }
  return res;
};

const replaceTagImports = ({ path, state, opts, types: t }) => {
  for (const change of opts.changes) {
    if (change.tag && Array.isArray(change.tag.paths) && change.tag.paths.length > 0) {
      for (const { from, to } of change.tag.paths) {
        if (from === path.node.source.value) {
          const relativePart = '../'.repeat(getFolderDepth(state.filePath));
          const updatedPath = pathModule.join(relativePart, to);
          path.node.source = t.stringLiteral(updatedPath);
        }
      }
    }
  }
};

const replaceTemplateElements = ({ path, opts }) => {
  const replaceTag = (value, from, to) => value.replace(new RegExp(from, 'g'), to);
  path.node.quasi.quasis.forEach(quasi => {
    opts.changes.forEach(change => {
      if (change.tag && quasi.value.raw.match(change.tag.from)) {
        quasi.value.raw = replaceTag(quasi.value.raw, change.tag.from, change.tag.to);
        if (typeof quasi.value.cooked === 'string') {
          quasi.value.cooked = replaceTag(quasi.value.cooked, change.tag.from, change.tag.to);
        }
      }
    });
  });
};

const insertImportStatements = ({ imports, path }) => {
  path.node.body = [...imports, ...path.node.body];
};

module.exports = ({ types: t }) => ({
  visitor: {
    ImportDeclaration(path, state) {
      // If a filePath is not passed explicitly by the user, take the filename provided by babel
      // and subtract the rootpath from it, to get the desired filePath relative to the root.
      state.filePath = state.opts.__filePath
        ? state.opts.__filePath
        : state.file.opts.filename.replace(state.opts.rootPath, '');

      if (path.node.specifiers.length > 0) {
        detectImported({ path, state, opts: state.opts, types: t });
      } else {
        replaceTagImports({ path, state, opts: state.opts, types: t });
      }
    },
    TaggedTemplateExpression(path, state) {
      if (t.isIdentifier(path.node.tag) && path.node.tag.name === 'html') {
        replaceTemplateElements({ path, opts: state.opts });
      }
    },
    Program: {
      enter: (path, state) => {
        // if __filePath is provided directly then we assume you are a test or you know what you are doing
        if (!state.opts.__filePath) {
          if (!state.opts.rootPath) {
            throw new Error(
              `babel-plugin-extend-docs: You need to provide a rootPath option (string)\nExample: rootPath: path.resolve('.')`,
            );
          }
          if (!fs.existsSync(state.opts.rootPath)) {
            throw new Error(
              `babel-plugin-extend-docs: The provided rootPath "${state.opts.rootPath}" does not exist.`,
            );
          }
          if (!fs.lstatSync(state.opts.rootPath).isDirectory()) {
            throw new Error(
              `babel-plugin-extend-docs: The provided rootPath "${state.opts.rootPath}" is not a directory.`,
            );
          }
        }
        if (!state.opts.changes) {
          throw new Error(
            `babel-plugin-extend-docs: You need to provide a changes array (string)\nExample: changes: [...]`,
          );
        }

        state.importedStorage = [];
        state.filePath = '';
      },
      exit: (path, state) => {
        const imports = generateImportStatements({ state, types: t });
        insertImportStatements({ imports, path });
      },
    },
  },
});
