jest.mock("@vercel/analytics/next", () => ({ Analytics: jest.fn(() => null) }));

jest.mock("@/app/providers", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { render, screen } from "@testing-library/react";
import { Analytics } from "@vercel/analytics/next";
import RootLayout from "./layout";

const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

afterAll(() => consoleError.mockRestore());

test("renders children in layout", () => {
  render(<RootLayout><p>Content</p></RootLayout>);
  expect(screen.getByText("Content")).toBeInTheDocument();
});

test("mounts Vercel analytics on every page", () => {
  render(<RootLayout><p>Content</p></RootLayout>);
  expect(Analytics).toHaveBeenCalled();
});
