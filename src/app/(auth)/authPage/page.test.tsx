jest.mock("@/components/auth-collage-panel/AuthCollagePanel", () => ({
  __esModule: true,
  default: () => <div data-testid="collage-panel" />,
}));

jest.mock("@/components/login-user-form/LoginUserForm", () => ({
  __esModule: true,
  default: ({ setIsLogin }: any) => (
    <div data-testid="login-form">
      <button onClick={() => setIsLogin(false)}>Go Register</button>
    </div>
  ),
}));

jest.mock("@/components/register-user-form/RegisterUserForm", () => ({
  __esModule: true,
  default: ({ setIsLogin }: any) => (
    <div data-testid="register-form">
      <button onClick={() => setIsLogin(true)}>Go Login</button>
    </div>
  ),
}));

import { render, screen, fireEvent } from "@testing-library/react";
import AuthPage from "./page";

// Login renders in both mobile + desktop divs simultaneously — use getAllByTestId
test("renders login form by default", () => {
  render(<AuthPage />);
  expect(screen.getAllByTestId("login-form").length).toBeGreaterThan(0);
});

test("switches to register form", () => {
  render(<AuthPage />);
  fireEvent.click(screen.getAllByText("Go Register")[0]);
  expect(screen.getAllByTestId("register-form").length).toBeGreaterThan(0);
});

test("switches back to login from register", () => {
  render(<AuthPage />);
  fireEvent.click(screen.getAllByText("Go Register")[0]);
  fireEvent.click(screen.getAllByText("Go Login")[0]);
  expect(screen.getAllByTestId("login-form").length).toBeGreaterThan(0);
});
