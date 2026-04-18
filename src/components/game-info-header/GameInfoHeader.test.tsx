import { render, screen } from "@testing-library/react";
import GameInfoHeader from "./GameInfoHeader";

const mockGameData = {
  ID: 1,
  Title: "Sly Cooper",
  ConsoleName: "PS2",
  ConsoleID: 21,
  ImageIcon: "/icon.png",
  ImageBoxArt: "/boxart.png",
  Publisher: "Sony",
  Developer: "Sucker Punch",
  Genre: "Platformer",
  Released: "2002",
  NumAwardedToUser: 5,
  NumAchievements: 10,
  UserCompletion: "50%",
  UserCompletionHardcore: "25%",
} as any;

test("renders game title and info", () => {
  render(<GameInfoHeader gameData={mockGameData} />);
  expect(screen.getByText("Sly Cooper")).toBeInTheDocument();
  expect(screen.getByText("PS2")).toBeInTheDocument();
  expect(screen.getByText("5 / 10")).toBeInTheDocument();
});

test("renders without gameData", () => {
  const { container } = render(<GameInfoHeader />);
  expect(container.querySelector("section")).toBeInTheDocument();
});

test("renders completed highlight when all achievements earned", () => {
  render(<GameInfoHeader gameData={{ ...mockGameData, NumAwardedToUser: 10, NumAchievements: 10 }} />);
  expect(screen.getByText("10 / 10")).toBeInTheDocument();
});

test("renders without console icon when ConsoleID not in CONSOLES", () => {
  render(<GameInfoHeader gameData={{ ...mockGameData, ConsoleID: 999 }} />);
  expect(screen.getByText("Sly Cooper")).toBeInTheDocument();
});
