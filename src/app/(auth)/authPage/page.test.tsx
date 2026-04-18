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

test("renders login form by default", () => {
  render(<AuthPage />);
  expect(screen.getByTestId("login-form")).toBeInTheDocument();
});

test("switches to register form", () => {
  render(<AuthPage />);
  fireEvent.click(screen.getByText("Go Register"));
  expect(screen.getByTestId("register-form")).toBeInTheDocument();
});

test("switches back to login from register", () => {
  render(<AuthPage />);
  fireEvent.click(screen.getByText("Go Register"));
  fireEvent.click(screen.getByText("Go Login"));
  expect(screen.getByTestId("login-form")).toBeInTheDocument();
});
