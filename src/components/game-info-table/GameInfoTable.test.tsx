import { render, screen } from "@testing-library/react";
import GameInfoTable from "./GameInfoTable";

const mockAchievement = {
  ID: 1,
  Title: "First Blood",
  Description: "Kill an enemy",
  BadgeName: "badge123",
  Points: 10,
  TrueRatio: 15,
  NumAwarded: 500,
  NumAwardedHardcore: 100,
  DateEarned: null,
  DateEarnedHardcore: null,
  Author: "Author1",
  AuthorULID: "ulid",
  DateModified: "2023-01-01",
  DateCreated: "2022-01-01",
  DisplayOrder: 1,
  MemAddr: "0x0000",
};

const mockGameData = {
  Achievements: { "1": mockAchievement },
} as any;

test("renders table with achievements", () => {
  render(<GameInfoTable gameData={mockGameData} />);
  expect(screen.getByText("Icono")).toBeInTheDocument();
  expect(screen.getByText("First Blood")).toBeInTheDocument();
});

test("renders empty when no gameData", () => {
  const { container } = render(<GameInfoTable />);
  expect(container.querySelector("table")).toBeNull();
});

test("filters out undefined achievements", () => {
  const gameData = { Achievements: { "1": mockAchievement, "2": undefined } } as any;
  render(<GameInfoTable gameData={gameData} />);
  expect(screen.getByText("First Blood")).toBeInTheDocument();
});

test("handles null Achievements with ?? fallback", () => {
  render(<GameInfoTable gameData={{ Achievements: null } as any} />);
  expect(screen.getByText("Icono")).toBeInTheDocument();
});
