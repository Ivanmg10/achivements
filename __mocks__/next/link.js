const React = require("react");
const Link = ({ href, children, ...props }) =>
  React.createElement("a", { href, ...props }, children);
module.exports = Link;
module.exports.default = Link;
