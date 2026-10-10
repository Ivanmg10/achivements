const React = require("react");
// next/image's own props (unoptimized, priority, fill…) are not attributes of an <img>.
const Image = ({ src, alt, width, height, unoptimized, priority, fill, quality, placeholder, blurDataURL, loader, ...props }) =>
  React.createElement("img", { src, alt, width, height, ...props });
module.exports = Image;
module.exports.default = Image;
