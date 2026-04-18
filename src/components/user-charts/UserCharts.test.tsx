jest.mock("@/utils/apiCallsUtils", () => ({
  getAllGamesPlayed: jest.fn(),
  getRecentAchievements: jest.fn(),
}));

jest.mock("@/components/games-played-pie-chart/GamesPlayedPieChart", () => ({
  __esModule: true,
  default: () => <div data-testid="pie-chart">PieChart</div>,
}));

jest.mock("@/components/achivements-line-chart/AchievementsLineChart", () => ({
  __esModule: true,
  default: () => <div data-testid="line-chart">LineChart</div>,
}));

import { render, screen, fireEvent } from "@testing-library/react";
import UserCharts from "./UserCharts";
import { useSession } from "next-auth/react";

beforeEach(() => {
  jest.clearAllMocks();
  const { getAllGamesPlayed, getRecentAchievements } = require("@/utils/apiCallsUtils");
  (getAllGamesPlayed as jest.Mock).mockImplementation(() => Promise.resolve());
  (getRecentAchievements as jest.Mock).mockImplementation(() => Promise.resolve());
});

test("renders charts section", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<UserCharts />);
  expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  expect(screen.getByTestId("line-chart")).toBeInTheDocument();
});

test("toggles to hardcore chart", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<UserCharts />);
  fireEvent.click(screen.getByText("Hardcore"));
  expect(screen.getByText("Juegos hardcore")).toBeInTheDocument();
});

test("does not fetch when not authenticated", () => {
  const { getAllGamesPlayed } = require("@/utils/apiCallsUtils");
  (useSession as jest.Mock).mockReturnValue({
    status: "unauthenticated",
    data: null,
  });
  render(<UserCharts />);
  expect(getAllGamesPlayed).not.toHaveBeenCalled();
});

test("toggles back to softcore", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<UserCharts />);
  fireEvent.click(screen.getByText("Hardcore"));
  fireEvent.click(screen.getByText("Softcore"));
  expect(screen.getByText("Juegos softcore")).toBeInTheDocument();
});
