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
});

test("renders the ID/Publisher/Developer/Genre/Released list", () => {
  render(<GameInfoHeader gameData={mockGameData} />);
  const list = screen.getByText("Sly Cooper").closest("section")?.querySelector("ul");
  expect(list?.textContent).toContain("Sony");
  expect(list?.textContent).toContain("Sucker Punch");
  expect(list?.textContent).toContain("Platformer");
  expect(list?.textContent).toContain("2002");
});

test("renders without gameData", () => {
  const { container } = render(<GameInfoHeader />);
  expect(container.querySelector("section")).toBeInTheDocument();
});

test("renders achievements and points as badges in the top-right column", () => {
  render(<GameInfoHeader gameData={mockGameData} />);
  expect(screen.getByText("5 / 10")).toBeInTheDocument();
});

test("highlights the achievements badge in success color once fully earned", () => {
  render(<GameInfoHeader gameData={{ ...mockGameData, NumAwardedToUser: 10 }} />);
  expect(screen.getByText("10 / 10").closest("div")).toHaveClass("text-success");
});

test("renders a points badge with earned/total when the game has achievements", () => {
  const gameData = {
    ...mockGameData,
    Achievements: {
      a: { Points: 10, DateEarned: "2024-01-01" },
      b: { Points: 5 },
    },
  };
  render(<GameInfoHeader gameData={gameData} />);
  expect(screen.getByText("10 / 15")).toBeInTheDocument();
});

test("does not render a points badge when the game has no achievement points", () => {
  render(<GameInfoHeader gameData={mockGameData} />);
  expect(screen.queryByText("Points")).not.toBeInTheDocument();
});

test("renders without console icon when ConsoleID not in CONSOLES", () => {
  render(<GameInfoHeader gameData={{ ...mockGameData, ConsoleID: 999 }} />);
  expect(screen.getByText("Sly Cooper")).toBeInTheDocument();
});

test("uses the localized 'View on RA' label instead of a hardcoded string", () => {
  render(<GameInfoHeader gameData={mockGameData} />);
  expect(screen.getByRole("link", { name: /View on RA/i })).toHaveAttribute(
    "href",
    "https://retroachievements.org/game/1"
  );
});

test("uses the localized hashes label instead of a hardcoded Spanish string", () => {
  render(<GameInfoHeader gameData={mockGameData} />);
  expect(screen.getByRole("button", { name: "Compatible hashes" })).toBeInTheDocument();
});
