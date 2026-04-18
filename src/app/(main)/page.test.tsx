jest.mock("@/components/main-page/MainPage", () => ({
  __esModule: true,
  default: () => <div data-testid="main-page">MainPage</div>,
}));

jest.mock("@/components/main-side-panel/MainSidePanel", () => ({
  __esModule: true,
  default: () => <div data-testid="side-panel">SidePanel</div>,
}));

import { render, screen } from "@testing-library/react";
import Home from "./page";

test("renders main page and side panel", () => {
  render(<Home />);
  expect(screen.getByTestId("main-page")).toBeInTheDocument();
  expect(screen.getByTestId("side-panel")).toBeInTheDocument();
});
