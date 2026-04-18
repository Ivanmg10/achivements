const React = require("react");
const Image = ({ src, alt, width, height, ...props }) =>
  React.createElement("img", { src, alt, width, height, ...props });
module.exports = Image;
module.exports.default = Image;
