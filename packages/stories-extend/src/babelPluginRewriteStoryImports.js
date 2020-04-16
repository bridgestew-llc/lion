/* eslint-disable no-param-reassign */
const replaceImportPath = ({ path, className, opts, types: t }) => {
  const changeObj = opts.changes.find(change => change.name === className);
  const { fromPaths, toPath } = changeObj.variable;
  const { filePath } = opts; // Note: can also use rootPath if it's convenient. So far it wasn't yet ;)

  // -1 because filepath is an absolute path starting with '/' and we turn it into a relative path without a '/' at the start
  const folderDepth = [...filePath.matchAll(new RegExp('/', 'g'))].length - 1;

  // Verify that our import path is included as one of the fromPaths from the config
  const fromPathsMatches = fromPaths.filter(fromPath =>
    path.node.source.value.match(new RegExp(fromPath)),
  );

  if (fromPathsMatches.length > 0) {
    path.node.source = t.stringLiteral(`${'../'.repeat(folderDepth)}${toPath}`);
  } else {
    // TODO: throw error here that even though we found a class import match,
    // we cannot find the path in our fromPaths from the configuration options
    // Alternatively, get rid of fromPaths altogether if we don't need it, maybe filePath is enough information already.
  }
};

const replaceImported = ({ specifier, className, opts, types: t }) => {
  if (t.isIdentifier(specifier.imported)) {
    const changeObj = opts.changes.find(change => change.name === className);
    const variableTo = changeObj.variable.to;
    // TODO: Probably only need to handle ImportSpecifier (named exports), and can remove the switch
    // Should perhaps verify that we never do unnamed exports for stuff that need to be replaced by extension.. I think we're okay :)
    switch (specifier.type) {
      case 'ImportSpecifier':
        // Don't override Bar in import { LionFoo as Bar }, only for import { LionFoo as LionFoo } which is the equivalent of import { LionFoo }
        if (specifier.local.name === specifier.imported.name) {
          specifier.local = t.identifier(variableTo);
        }
        specifier.imported = t.identifier(variableTo);
        break;
      case 'ImportDefaultSpecifier':
        // Default specifiers we don't need to replace I think?
        // specifier.local = t.identifier(variableTo);
        break;
      case 'ImportNamespaceSpecifier':
        // do nothing for `import * as x...` ? I don't think we can allow people to use this since we cannot replace it with something useful?
        break;
      // no default
    }
  }
};

module.exports = ({ types: t }) => ({
  visitor: {
    /**
     * Finds import declarations and
     * 1) replace the importeds (LionX -> WolfX)
     * 2) replace the path (./src/index.js -> ../../../index.js)
     */
    ImportDeclaration(path, state) {
      let className = '';
      path.node.specifiers.forEach(specifier => {
        if (specifier.imported.name.match(new RegExp('Lion.*'))) {
          className = specifier.imported.name;

          replaceImported({ specifier, className, opts: state.opts, types: t });

          if (t.isLiteral(path.node.source)) {
            replaceImportPath({ path, className, opts: state.opts, types: t });
          }
        }
      });
    },
  },
});
