/* eslint-disable no-param-reassign */

// -1 because filepath is an absolute path starting with '/' and we turn it into a relative path without a '/' at the start
const getFolderDepth = filePath => [...filePath.match(new RegExp('/', 'g'))].length - 1;

/**
 * Example: import someDefaultHelper, { LionInput, someHelper } from './src/LionInput.js';
 * We should filter out the imports that we need to replace and store for now (LionInput).
 * Then in the post step, we can create the necessary new imports
 */
const detectImported = ({ path, opts, types: t, importedStorage }) => {
  path.node.specifiers = path.node.specifiers.filter(specifier => {
    if (t.isIdentifier(specifier.imported) && specifier.type === 'ImportSpecifier') {
      const changeObj = opts.changes.find(change => change.name === specifier.imported.name);
      // TODO: Do we need to add a check here to see if path.node.source.value matches one of the changeObj.variable.fromPaths? Do we care?
      let importAs; // keep undefined in case we dont have a special local that is different from imported
      if (
        specifier.local &&
        specifier.local.name &&
        specifier.local.name !== specifier.imported.name
      ) {
        importAs = specifier.local.name;
      }

      if (changeObj) {
        importedStorage.push({
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

const replaceTagImports = ({ path, opts, types: t }) => {
  opts.changes.forEach(change => {
    const foundFromPath =
      change.tag &&
      change.tag.fromPaths.find(fromPath => path.node.source.value.match(new RegExp(fromPath))); // TODO: don't just match, be more strict here, it should be for the most part the exact `same` path

    if (foundFromPath) {
      path.node.source = t.stringLiteral(
        `${'../'.repeat(getFolderDepth(opts.filePath))}${change.tag.toPath}`,
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

const generateImportStatements = ({ importedStorage, filePath, types: t }) => {
  const newImportsMap = new Map();
  importedStorage.forEach(imp => {
    newImportsMap.set(imp.changeObj.variable.toPath, [
      ...(newImportsMap.get(imp.changeObj.variable.toPath) || []),
      {
        importName: imp.changeObj.variable.to,
        importAs: imp.importAs || imp.changeObj.variable.to,
      },
    ]);
  });

  return Array.from(newImportsMap).map(value => {
    const source = t.stringLiteral(`${'../'.repeat(getFolderDepth(filePath))}${value[0]}`);
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
  pre() {
    this.importedStorage = [];
    this.filePath = '';
  },
  visitor: {
    /**
     * Finds import declarations and
     * 1) replace the importeds (LionX -> WolfX)
     * 2) replace the path (./src/index.js -> ../../../index.js)
     */
    ImportDeclaration(path, state) {
      // If a filePath is not passed explicitly by the user, take the filename provided by babel
      // and subtract the rootpath from it, to get the desired filePath relative to the root.
      if (!state.opts.filePath) {
        state.opts.filePath = state.file.opts.filename.replace(state.opts.rootPath, '');
      }

      if (!this.filePath) {
        this.filePath = state.opts.filePath;
      }

      if (path.node.specifiers.length > 0) {
        detectImported({ path, opts: state.opts, types: t, importedStorage: this.importedStorage });
      } else {
        replaceTagImports({ path, opts: state.opts, types: t });
      }
    },
    TaggedTemplateExpression(path, state) {
      if (t.isIdentifier(path.node.tag) && path.node.tag.name === 'html') {
        replaceTemplateElements({ path, opts: state.opts });
      }
    },
    Program: {
      // Using unnamed function because of `this` binding importance
      // eslint-disable-next-line object-shorthand, func-names
      exit: function (path) {
        const imports = generateImportStatements({
          importedStorage: this.importedStorage,
          filePath: this.filePath,
          types: t,
        });
        insertImportStatements({ imports, path });
      },
    },
  },
});
