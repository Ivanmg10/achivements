function mockFont() {
  return { className: 'mocked-font', variable: '--font-mocked', style: {} };
}

module.exports = new Proxy(
  {},
  {
    get() {
      return mockFont;
    },
  },
);
