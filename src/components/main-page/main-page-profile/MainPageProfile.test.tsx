jest.mock("@/components/main-page/main-page-profile/main-page-profile-st/MainPageProfileSt", () => ({
  __esModule: true,
  default: () => <div data-testid="profile-st">ProfileSt</div>,
}));
jest.mock("@/context/SteamGamesDataContext", () => ({
  useSteamGamesData: jest.fn(() => ({ isLinked: false })),
}));
jest.mock("@/components/main-page/main-page-profile/main-page-profile-ra/MainPageProfileRa", () => ({
  __esModule: true,
  default: () => <div data-testid="profile-ra">ProfileRa</div>,
}));

import { render, screen } from "@testing-library/react";
import MainPageProfile from "./MainPageProfile";
import { useSession } from "next-auth/react";
import { useSteamGamesData } from "@/context/SteamGamesDataContext";

test("renders profile sub-components", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: { User: "Ivan", LastGameID: 19010 } } },
  });
  render(<MainPageProfile />);
  expect(screen.getByTestId("profile-ra")).toBeInTheDocument();
});

test("renders without raUser", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: null } },
  });
  render(<MainPageProfile />);
  expect(screen.getByTestId("profile-ra")).toBeInTheDocument();
});

describe("Steam profile", () => {
  afterEach(() => (useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: false }));

  test("is shown under the RA profile once Steam is linked", () => {
    (useSession as jest.Mock).mockReturnValue({ data: { user: { raUser: { User: "Ivan" } } } });
    (useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: true });
    render(<MainPageProfile />);
    expect(screen.getByTestId("profile-st")).toBeInTheDocument();
  });

  test("is not shown — no connect prompt either — while Steam is unlinked", () => {
    (useSession as jest.Mock).mockReturnValue({ data: { user: { raUser: { User: "Ivan" } } } });
    render(<MainPageProfile />);
    expect(screen.queryByTestId("profile-st")).not.toBeInTheDocument();
  });
});
