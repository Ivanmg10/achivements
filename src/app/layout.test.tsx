jest.mock("@/app/providers", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { render, screen } from "@testing-library/react";
import RootLayout from "./layout";

const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

afterAll(() => consoleError.mockRestore());

test("renders children in layout", () => {
  render(<RootLayout><p>Content</p></RootLayout>);
  expect(screen.getByText("Content")).toBeInTheDocument();
});
