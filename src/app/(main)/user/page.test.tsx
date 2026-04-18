jest.mock("@/components/no-main-header/NoMainHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="no-header">NoHeader</div>,
}));

jest.mock("@/components/user-data/UserData", () => ({
  __esModule: true,
  default: () => <div data-testid="user-data">UserData</div>,
}));

jest.mock("@/components/user-charts/UserCharts", () => ({
  __esModule: true,
  default: () => <div data-testid="user-charts">UserCharts</div>,
}));

jest.mock("@/components/user-config/UserConfig", () => ({
  __esModule: true,
  default: () => <div data-testid="user-config">UserConfig</div>,
}));

import { render, screen } from "@testing-library/react";
import UserPage from "./page";
import { useSession } from "next-auth/react";

test("renders all user page sections", () => {
  (useSession as jest.Mock).mockReturnValue({ data: null });
  render(<UserPage />);
  expect(screen.getByTestId("no-header")).toBeInTheDocument();
  expect(screen.getByTestId("user-data")).toBeInTheDocument();
  expect(screen.getByTestId("user-charts")).toBeInTheDocument();
  expect(screen.getByTestId("user-config")).toBeInTheDocument();
});
