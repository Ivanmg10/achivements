import { render, screen } from "@testing-library/react";
import MainPageProgressionCard from "./MainPageProgressionCard";

const mockGame = {
  ID: 1,
  GameTitle: "Sly Cooper",
  Title: "Sly Cooper and the Thievius Raccoonus",
  ConsoleName: "PS2",
  ImageIcon: "/icon.png",
  UserCompletion: "50%",
} as any;

test("renders game title and console", () => {
  render(<MainPageProgressionCard game={mockGame} />);
  expect(screen.getByText("Sly Cooper")).toBeInTheDocument();
  expect(screen.getByText("PS2")).toBeInTheDocument();
});

test("renders Title when GameTitle is absent", () => {
  render(
    <MainPageProgressionCard
      game={{ ...mockGame, GameTitle: null }}
    />,
  );
  expect(screen.getByText("Sly Cooper and the Thievius Raccoonus")).toBeInTheDocument();
});

test("renders without ImageIcon", () => {
  render(<MainPageProgressionCard game={{ ...mockGame, ImageIcon: null }} />);
  expect(screen.getByText("Sly Cooper")).toBeInTheDocument();
});

test("renders link to gameInfo", () => {
  render(<MainPageProgressionCard game={mockGame} />);
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", "/gameInfo/1");
});

test("handles null UserCompletion", () => {
  render(<MainPageProgressionCard game={{ ...mockGame, UserCompletion: null }} />);
  expect(screen.getByText("Sly Cooper")).toBeInTheDocument();
});
