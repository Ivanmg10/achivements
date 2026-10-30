jest.mock("@/components/auth-collage-panel/AuthCollagePanel", () => ({
  __esModule: true,
  default: () => <div data-testid="collage-panel" />,
}));

jest.mock("@/components/login-user-form/LoginUserForm", () => ({
  __esModule: true,
  default: ({ setIsLogin }: { setIsLogin: (login: boolean) => void }) => (
    <div data-testid="login-form">
      <button onClick={() => setIsLogin(false)}>Go Register</button>
    </div>
  ),
}));

jest.mock("@/components/register-user-form/RegisterUserForm", () => ({
  __esModule: true,
  default: ({ setIsLogin }: { setIsLogin: (login: boolean) => void }) => (
    <div data-testid="register-form">
      <button onClick={() => setIsLogin(true)}>Go Login</button>
    </div>
  ),
}));

import { render, screen, fireEvent } from "@testing-library/react";
import AuthPage from "./page";

let query: { mode?: string } = {};
import { en } from "@/translations/en";

beforeEach(() => {
  query = {};
});

// Login renders in both mobile + desktop divs simultaneously — use getAllByTestId
test("renders login form by default", async () => {
  render(await AuthPage({ searchParams: Promise.resolve(query) }));
  expect(screen.getAllByTestId("login-form").length).toBeGreaterThan(0);
});

test("switches to register form", async () => {
  render(await AuthPage({ searchParams: Promise.resolve(query) }));
  fireEvent.click(screen.getAllByText("Go Register")[0]);
  expect(screen.getAllByTestId("register-form").length).toBeGreaterThan(0);
});

test("switches back to login from register", async () => {
  render(await AuthPage({ searchParams: Promise.resolve(query) }));
  fireEvent.click(screen.getAllByText("Go Register")[0]);
  fireEvent.click(screen.getAllByText("Go Login")[0]);
  expect(screen.getAllByTestId("login-form").length).toBeGreaterThan(0);
});

test("?mode=register opens on the register form, as the landing button expects", async () => {
  query = { mode: "register" };
  render(await AuthPage({ searchParams: Promise.resolve(query) }));
  expect(screen.getAllByTestId("register-form").length).toBeGreaterThan(0);
});

test("links to the privacy policy once, where the account is created", async () => {
  render(await AuthPage({ searchParams: Promise.resolve(query) }));
  expect(screen.getByRole("link", { name: en.privacy.link })).toHaveAttribute("href", "/privacy");
});
