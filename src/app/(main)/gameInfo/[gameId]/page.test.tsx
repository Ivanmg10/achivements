jest.mock("@/utils/apiCallsUtils", () => ({
  getGamesInfo: jest.fn(),
}));

jest.mock("@/components/game-info-header/GameInfoHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="game-header">GameHeader</div>,
}));

jest.mock("@/components/game-info-table/GameInfoTable", () => ({
  __esModule: true,
  default: () => <div data-testid="game-table">GameTable</div>,
}));

jest.mock("@/components/no-main-header/NoMainHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="no-header">NoHeader</div>,
}));

jest.mock("@/components/main-spinner/Spinner", () => ({
  __esModule: true,
  default: () => <span data-testid="spinner" className="loader" />,
}));

import { render, screen, act } from "@testing-library/react";
import GameInfo from "./page";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { getGamesInfo } from "@/utils/apiCallsUtils";

beforeEach(() => {
  (useParams as jest.Mock).mockReturnValue({ gameId: "1234" });
});

test("renders spinner while gameData is null", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { rausername: "ivan", raid: "key" } },
  });
  (getGamesInfo as jest.Mock).mockImplementation(() => Promise.resolve());
  render(<GameInfo />);
  expect(screen.getByTestId("spinner")).toBeInTheDocument();
});

test("renders game info when data loaded", async () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { rausername: "ivan", raid: "key" } },
  });
  (getGamesInfo as jest.Mock).mockImplementation((_id, _session, setGameData) => {
    setGameData({ ID: 1, Title: "Sly Cooper" });
    return Promise.resolve();
  });
  await act(async () => {
    render(<GameInfo />);
  });
  expect(screen.getByTestId("game-header")).toBeInTheDocument();
  expect(screen.getByTestId("game-table")).toBeInTheDocument();
});

test("renders spinner when no session", () => {
  (useSession as jest.Mock).mockReturnValue({ data: null });
  render(<GameInfo />);
  expect(screen.getByTestId("spinner")).toBeInTheDocument();
});
