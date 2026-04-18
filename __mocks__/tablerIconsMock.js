const React = require("react");

function createIcon(name) {
  return function Icon({ className, size, stroke, ...props }) {
    return React.createElement("svg", {
      "data-testid": name,
      className,
      ...props,
    });
  };
}

module.exports = new Proxy(
  {},
  {
    get(_, prop) {
      return createIcon(prop);
    },
  },
);
