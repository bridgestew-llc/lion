/* eslint-disable no-param-reassign */
const fs = require('fs');

// -1 because filepath is an absolute path starting with '/' and we turn it into a relative path without a '/' at the start
const getFolderDepth = filePath => [...filePath.match(new RegExp('/', 'g'))].length - 1;

/**
 * Example: import someDefaultHelper, { LionInput, someHelper } from './src/LionInput.js';
 * We should filter out the imports that we need to replace and store for now (LionInput).
 * Then in the exit step, we can create the necessary new imports and insert them
 */
const detectImported = ({ path, state, opts, types: t }) => {
  path.node.specifiers = path.node.specifiers.filter(specifier => {
    if (t.isIdentifier(specifier.imported) && specifier.type === 'ImportSpecifier') {
      const changeObj = opts.changes.find(change => change.name === specifier.imported.name);
      // TODO: Do we need to add a check here to see if path.node.source.value matches one of the changeObj.variable.fromPaths? Do we care?

      // keep undefined in case we dont have a special local that is different from imported
      let importAs;

      if (
        specifier.local &&
        specifier.local.name &&
        specifier.local.name !== specifier.imported.name
      ) {
        importAs = specifier.local.name;
      }

      if (changeObj) {
        state.importedStorage.push({
          importName: specifier.imported.name,
          importAs,
          changeObj,
        });
        return false;
      }
    }
    return true;
  });

  // e.g. `import '@lion-button';`  --> nothing is imported, so remove the import declaration entirely.
  if (path.node.specifiers.length === 0) {
    path.remove();
  }
};

const replaceTagImports = ({ path, state, opts, types: t }) => {
  opts.changes.forEach(change => {
    const foundFromPath =
      change.tag &&
      change.tag.fromPaths.find(fromPath => path.node.source.value.match(new RegExp(fromPath))); // TODO: don't just match, be more strict here, it should be for the most part the exact `same` path

    if (foundFromPath) {
      path.node.source = t.stringLiteral(
        `${'../'.repeat(getFolderDepth(state.filePath))}${change.tag.toPath}`,
      );
    }
  });
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

const generateImportStatements = ({ state, types: t }) => {
  const newImportsMap = new Map();
  state.importedStorage.forEach(imp => {
    newImportsMap.set(imp.changeObj.variable.toPath, [
      ...(newImportsMap.get(imp.changeObj.variable.toPath) || []),
      {
        importName: imp.changeObj.variable.to,
        importAs: imp.importAs || imp.changeObj.variable.to,
      },
    ]);
  });

  return Array.from(newImportsMap).map(value => {
    const source = t.stringLiteral(`${'../'.repeat(getFolderDepth(state.filePath))}${value[0]}`);
    const importSpecifiers = value[1].map(subValue =>
      t.importSpecifier(t.identifier(subValue.importAs), t.identifier(subValue.importName)),
    );
    return t.importDeclaration(importSpecifiers, source);
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
