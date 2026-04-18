import { render, screen } from "@testing-library/react";
import GameInfoProgressionHeader from "./GameInfoProgressionHeader";

const mockGameData = {
  UserCompletion: "50%",
  UserCompletionHardcore: "25%",
} as any;

test("renders progression bars", () => {
  render(<GameInfoProgressionHeader gameData={mockGameData} />);
  expect(screen.getByText("Standard:")).toBeInTheDocument();
  expect(screen.getByText("Hardcore:")).toBeInTheDocument();
  expect(screen.getAllByText("100%").length).toBe(2);
});

test("renders without gameData", () => {
  render(<GameInfoProgressionHeader />);
  expect(screen.getByText("Standard:")).toBeInTheDocument();
});

test("renders with null UserCompletion", () => {
  render(<GameInfoProgressionHeader gameData={{ UserCompletion: null, UserCompletionHardcore: null } as any} />);
  expect(screen.getByText("Standard:")).toBeInTheDocument();
});
