/* eslint-disable no-param-reassign */

// -1 because filepath is an absolute path starting with '/' and we turn it into a relative path without a '/' at the start
const getFolderDepth = filePath => [...filePath.matchAll(new RegExp('/', 'g'))].length - 1;

const replaceImportPath = ({ path, changeObj, opts, types: t }) => {
  const { fromPaths, toPath } = changeObj.variable;

  // Verify that our import path is included as one of the fromPaths from the config
  const fromPathsMatches = fromPaths.filter(fromPath =>
    path.node.source.value.match(new RegExp(fromPath)),
  );

  if (fromPathsMatches.length > 0) {
    path.node.source = t.stringLiteral(`${'../'.repeat(getFolderDepth(opts.filePath))}${toPath}`);
  } else {
    // TODO: throw error here that even though we found a class import match,
    // we cannot find the path in our fromPaths from the configuration options
  }
};

const replaceImported = ({ specifier, changeObj, types: t }) => {
  if (t.isIdentifier(specifier.imported) && specifier.type === 'ImportSpecifier') {
    const variableTo = changeObj.variable.to;

    // Don't override Bar in import { LionFoo as Bar }, only for import { LionFoo as LionFoo } which is the equivalent of import { LionFoo }
    if (specifier.local.name === specifier.imported.name) {
      specifier.local = t.identifier(variableTo);
    }
    specifier.imported = t.identifier(variableTo);
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

const generateImportStatements = () =>
  /**
   * TODO: implement. Goal is to:
   * 1) detect named imports that are to be replaced (checks the config) and store them in a data obj
   * 2) remove those named imports (remove entire statement if that's the only import)
   * 3) In this function we take the stored imports, and compile a list of import statements (combine imports from the same src)
   */
  [];
const insertImportStatements = (imports, state) => {
  imports.forEach(imp => {
    state.path.insertBefore(imp);
  });
};

module.exports = ({ types: t }) => ({
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

      if (path.node.specifiers.length > 0) {
        path.node.specifiers.forEach(specifier => {
          const changeObj = state.opts.changes.find(
            change => change.name === specifier.imported.name,
          );
          if (changeObj) {
            replaceImported({ specifier, changeObj, types: t });
            if (t.isLiteral(path.node.source)) {
              replaceImportPath({ path, changeObj, opts: state.opts, types: t });
            }
          }
        });
      } else {
        replaceTagImports({ path, opts: state.opts, types: t });
      }
    },
    TaggedTemplateExpression(path, state) {
      if (t.isIdentifier(path.node.tag) && path.node.tag.name === 'html') {
        replaceTemplateElements({ path, opts: state.opts });
      }
    },
  },
  post(state) {
    const imports = generateImportStatements();
    insertImportStatements(imports, state);
  },
});
