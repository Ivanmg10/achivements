jest.mock("@/components/main-footer/MainFooter", () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

jest.mock("@/components/main-header/MainHeader", () => ({
  __esModule: true,
  default: () => <header data-testid="header">Header</header>,
}));

import { render, screen } from "@testing-library/react";
import MainLayout from "./layout";

test("renders children and footer", () => {
  render(<MainLayout><p>Page Content</p></MainLayout>);
  expect(screen.getByText("Page Content")).toBeInTheDocument();
  expect(screen.getByTestId("footer")).toBeInTheDocument();
});
