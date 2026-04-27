jest.mock("@/utils/apiCallsUtils", () => ({
  getGamesCompleted: jest.fn((session, setGames, setHardcore) => {
    setGames([
      {
        GameID: 1,
        GameTitle: "Sly Cooper",
        Title: "Sly Cooper",
        ConsoleID: 21,
        ConsoleName: "PS2",
        ImageIcon: "/icon.png",
        HardcoreMode: "0",
        PctWon: "1.0000",
      },
    ]);
    setHardcore([
      {
        GameID: 2,
        GameTitle: "Jak 2",
        Title: "Jak 2",
        ConsoleID: 21,
        ConsoleName: "PS2",
        ImageIcon: "/icon2.png",
        HardcoreMode: "1",
        PctWon: "1.0000",
      },
    ]);
  }),
}));

import { render, screen } from "@testing-library/react";
import MainPageCompleted from "./MainPageCompleted";
import { useSession } from "next-auth/react";

test("renders completed section header", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<MainPageCompleted />);
  expect(screen.getByText("Completados")).toBeInTheDocument();
});

test("renders softcore games on default tab", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<MainPageCompleted />);
  expect(screen.getByText("Sly Cooper")).toBeInTheDocument();
});

test("shows empty message when no games", () => {
  const { getGamesCompleted } = require("@/utils/apiCallsUtils");
  (getGamesCompleted as jest.Mock).mockImplementationOnce(
    (session: unknown, setGames: (g: unknown[]) => void, setHardcore: (g: unknown[]) => void) => {
      setGames([]);
      setHardcore([]);
    },
  );
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<MainPageCompleted />);
  expect(screen.getByText(/No hay juegos completados/)).toBeInTheDocument();
});
