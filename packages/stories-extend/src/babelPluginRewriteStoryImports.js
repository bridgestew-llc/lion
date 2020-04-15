/* eslint-disable no-param-reassign */
module.exports = ({ types: t }) => ({
  visitor: {
    BinaryExpression(path, state) {
      if (path.node.operator !== '===') {
        return;
      }
      path.node.left = t.identifier(`sebmck ${state.opts.foo ? state.opts.foo : ''}`);
      path.node.right = t.identifier('dork');
    },
  },
});
