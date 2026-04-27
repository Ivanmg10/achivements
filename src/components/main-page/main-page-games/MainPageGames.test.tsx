const mockInProgress = [
  {
    GameID: 1234,
    Title: "Crash Bandicoot",
    GameTitle: "Crash Bandicoot",
    ConsoleID: 12,
    ConsoleName: "PlayStation",
    ImageIcon: "/icon.png",
    MaxPossible: 40,
    NumAwarded: 18,
    PctWon: "0.4500",
    HardcoreMode: "0",
  },
];

jest.mock("@/utils/apiCallsUtils", () => ({
  getGamesInProgress: jest.fn((_session: unknown, setter: (g: unknown[]) => void) => {
    setter(mockInProgress);
  }),
}));

import { render, screen } from "@testing-library/react";
import MainPageRecommended from "./MainPageGames";
import { useSession } from "next-auth/react";

test("renders section title", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<MainPageRecommended />);
  expect(screen.getByText("Estoy jugando")).toBeInTheDocument();
});

test("renders in-progress games", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<MainPageRecommended />);
  expect(screen.getByText("Crash Bandicoot")).toBeInTheDocument();
});

test("shows empty message when no in-progress games", () => {
  const { getGamesInProgress } = require("@/utils/apiCallsUtils");
  (getGamesInProgress as jest.Mock).mockImplementationOnce(
    (_s: unknown, setter: (g: unknown[]) => void) => setter([]),
  );
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<MainPageRecommended />);
  expect(screen.getByText("No hay juegos en progreso")).toBeInTheDocument();
});

test("hasFetched guard prevents double fetch", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  const { rerender } = render(<MainPageRecommended />);
  (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated", data: null });
  rerender(<MainPageRecommended />);
  expect(screen.getByText("Estoy jugando")).toBeInTheDocument();
});
