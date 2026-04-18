jest.mock("@/mocks/gamesCompletedSoftcore.json", () => [
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
], { virtual: true });

jest.mock("@/mocks/gamesCompletedHardcore.json", () => [
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
], { virtual: true });

import { render, screen } from "@testing-library/react";
import MainPageCompleted from "./MainPageCompleted";
import { useSession } from "next-auth/react";

test("renders completed section headers", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<MainPageCompleted />);
  expect(screen.getByText("Completados")).toBeInTheDocument();
  expect(screen.getByText("Completados hardocre")).toBeInTheDocument();
});

test("renders softcore and hardcore games", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<MainPageCompleted />);
  expect(screen.getByText("Sly Cooper")).toBeInTheDocument();
  expect(screen.getByText("Jak 2")).toBeInTheDocument();
});
