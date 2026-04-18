jest.mock("@/utils/apiCallsUtils", () => ({
  getWantGames: jest.fn(),
}));

import { render, screen, act } from "@testing-library/react";
import MainPageWantToPlay from "./MainPageWantToPlay";
import { useSession } from "next-auth/react";
import { getWantGames } from "@/utils/apiCallsUtils";

const mockGames = [
  {
    ID: 1,
    GameTitle: "Pokémon Emerald",
    Title: "Pokémon Emerald",
    ConsoleID: 5,
    ConsoleName: "GBA",
    ImageIcon: "/icon.png",
  },
];

beforeEach(() => {
  (getWantGames as jest.Mock).mockImplementation((_session, setWantGames, _setError) => {
    setWantGames(mockGames);
    return Promise.resolve();
  });
});

test("hasFetched guard prevents double fetch", async () => {
  (getWantGames as jest.Mock).mockImplementation((_session, setWantGames) => {
    setWantGames(mockGames);
    return Promise.resolve();
  });
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  const { rerender } = render(<MainPageWantToPlay />);
  (useSession as jest.Mock).mockReturnValue({
    status: "unauthenticated",
    data: null,
  });
  rerender(<MainPageWantToPlay />);
  expect(getWantGames).toHaveBeenCalledTimes(1);
});

test("renders spinner when no games yet", () => {
  (getWantGames as jest.Mock).mockImplementation(() => Promise.resolve());
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  const { container } = render(<MainPageWantToPlay />);
  expect(container.querySelector(".loader")).toBeInTheDocument();
});

test("renders want-to-play games", async () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  await act(async () => {
    render(<MainPageWantToPlay />);
  });
  expect(screen.getByText("Pokémon Emerald")).toBeInTheDocument();
});

test("renders error state", async () => {
  (getWantGames as jest.Mock).mockImplementation((_session, _setGames, setError) => {
    setError("Network error");
    return Promise.resolve();
  });
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  await act(async () => {
    render(<MainPageWantToPlay />);
  });
  expect(screen.getByText("Error: Network error")).toBeInTheDocument();
});
