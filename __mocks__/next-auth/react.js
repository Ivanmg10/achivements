const React = require("react");

const SessionContext = React.createContext(undefined);

// Reads a SessionContext when one is provided (SubjectProviders does), and
// otherwise answers "signed out" — tests set their own session with mockReturnValue.
const useSession = jest.fn(() => {
  const value = React.useContext(SessionContext);
  return value ?? { data: null, status: "unauthenticated", update: jest.fn() };
});

const SessionProvider = ({ children }) => React.createElement(React.Fragment, null, children);

const signIn = jest.fn();
const signOut = jest.fn();

module.exports = { useSession, SessionProvider, SessionContext, signIn, signOut };
