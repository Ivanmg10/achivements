const React = require("react");

const useSession = jest.fn(() => ({
  data: null,
  status: "unauthenticated",
  update: jest.fn(),
}));

const SessionProvider = ({ children }) => React.createElement(React.Fragment, null, children);

const signIn = jest.fn();
const signOut = jest.fn();

module.exports = { useSession, SessionProvider, signIn, signOut };
