const React = require("react");

// next/dynamic as a component that loads its module on first render, like the
// real one: the loading component shows until the import resolves, so a test
// that needs what is behind it waits for it (findBy…).
module.exports = {
  __esModule: true,
  default: (loader, options = {}) => {
    const Lazy = React.lazy(() => Promise.resolve(loader()).then((m) => ({ default: m.default ?? m })));
    const Loading = options.loading;
    return function Dynamic(props) {
      return React.createElement(
        React.Suspense,
        { fallback: Loading ? React.createElement(Loading) : null },
        React.createElement(Lazy, props)
      );
    };
  },
};
