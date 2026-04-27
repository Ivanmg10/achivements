import { render, screen } from "@testing-library/react";
import GamesPlayedPieChart from "./GamesPlayedPieChart";

const mockGames = [
  { ConsoleName: "PS2", GameID: 1, HardcoreMode: "0", PctWon: "1.0000" } as any,
  { ConsoleName: "PS2", GameID: 2, HardcoreMode: "0", PctWon: "0.5000" } as any,
  { ConsoleName: "GBA", GameID: 3, HardcoreMode: "0", PctWon: "1.0000" } as any,
];

test("renders pie chart", () => {
  render(<GamesPlayedPieChart games={mockGames} />);
  expect(screen.getByTestId("PieChart")).toBeInTheDocument();
});

test("renders empty state when no games", () => {
  render(<GamesPlayedPieChart games={[]} />);
  expect(screen.getByText("Sin datos")).toBeInTheDocument();
});
