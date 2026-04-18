const NextAuth = jest.fn(() => ({
  GET: jest.fn(),
  POST: jest.fn(),
}));
module.exports = NextAuth;
module.exports.default = NextAuth;
module.exports.getServerSession = jest.fn();
