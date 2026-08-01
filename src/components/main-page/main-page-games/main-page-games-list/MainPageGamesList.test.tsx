import { render, screen } from "@testing-library/react";
import MainPageGamesList from "./MainPageGamesList";

const games = [
  {
    GameTitle: "Sly Cooper",
    Title: "Sly Cooper and the Thievius",
    ConsoleID: 21,
    ConsoleName: "PS2",
    ImageIcon: "/icon.png",
    ID: "1",
    GameID: undefined,
  },
  {
    GameTitle: null,
    Title: "Crash Bandicoot",
    ConsoleID: 999,
    ConsoleName: "PS1",
    ImageIcon: undefined,
    ID: undefined,
    GameID: 2,
  },
] as any;

test("renders game list items", () => {
  render(<MainPageGamesList listGames={games} />);
  expect(screen.getByText("Sly Cooper")).toBeInTheDocument();
  expect(screen.getByText("Crash Bandicoot")).toBeInTheDocument();
});

test("uses GameTitle when available", () => {
  render(<MainPageGamesList listGames={games} />);
  expect(screen.getByText("Sly Cooper")).toBeInTheDocument();
});

test("falls back to Title when GameTitle absent", () => {
  render(<MainPageGamesList listGames={games} />);
  expect(screen.getByText("Crash Bandicoot")).toBeInTheDocument();
});

test("links use GameID when ID not available", () => {
  render(<MainPageGamesList listGames={games} />);
  const links = screen.getAllByRole("link");
  expect(links[1]).toHaveAttribute("href", "/gameInfo/2");
});

test("shows console icon for known consoles", () => {
  render(<MainPageGamesList listGames={[games[0]]} />);
  const imgs = screen.getAllByRole("img");
  expect(imgs.length).toBeGreaterThan(0);
});

test("shows total points for a want-to-play game", () => {
  const wantToPlay = [{ ...games[0], PointsTotal: 450, GameID: 1 }];
  render(<MainPageGamesList listGames={wantToPlay} />);
  expect(screen.getByText("450 pts")).toBeInTheDocument();
});

test("hides points line for a want-to-play game with zero total points", () => {
  const wantToPlay = [{ ...games[0], PointsTotal: 0, GameID: 1 }];
  render(<MainPageGamesList listGames={wantToPlay} />);
  expect(screen.queryByText(/pts/)).not.toBeInTheDocument();
});

test("shows earned/total points for a playing game when extraData is present", () => {
  const playing = [{ ...games[1], GameID: 2 }];
  const extraData = new Map([[2, { awards: [], possibleScore: 200, scoreAchieved: 120, scoreAchievedHardcore: 0 }]]);
  render(<MainPageGamesList listGames={playing} extraData={extraData} />);
  expect(screen.getByText("120/200 pts")).toBeInTheDocument();
});

test("hides points line for a playing game when extraData is missing", () => {
  const playing = [{ ...games[1], GameID: 2 }];
  render(<MainPageGamesList listGames={playing} />);
  expect(screen.queryByText(/pts/)).not.toBeInTheDocument();
});
