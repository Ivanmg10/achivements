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

import { render, screen, fireEvent } from "@testing-library/react";
import MainPageProfile from "./MainPageProfile";
import { useSession } from "next-auth/react";
import { useSteamGamesData } from "@/context/SteamGamesDataContext";
import { MainPlatformProvider } from "@/context/MainPlatformContext";

function renderProfile() {
  return render(
    <MainPlatformProvider>
      <MainPageProfile />
    </MainPlatformProvider>,
  );
}

test("renders profile sub-components", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: { User: "Ivan", LastGameID: 19010 } } },
  });
  renderProfile();
  expect(screen.getByTestId("profile-ra")).toBeInTheDocument();
});

test("renders without raUser", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: null } },
  });
  renderProfile();
  expect(screen.getByTestId("profile-ra")).toBeInTheDocument();
});

describe("RA / Steam tabs", () => {
  function bothAccounts() {
    (useSession as jest.Mock).mockReturnValue({ data: { user: { raUser: { User: "Ivan" } } } });
    (useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: true });
  }

  beforeEach(() => window.localStorage.clear());
  afterEach(() => (useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: false }));

  test("with both accounts, one profile at a time under tabs at the top — RA first", () => {
    bothAccounts();
    renderProfile();

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["RetroAchievements", "Steam"]);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("profile-ra")).toBeInTheDocument();
    expect(screen.queryByTestId("profile-st")).not.toBeInTheDocument();
  });

  test("switches to the Steam profile, in a panel labelled by its tab", () => {
    bothAccounts();
    renderProfile();
    fireEvent.click(screen.getByRole("tab", { name: "Steam" }));

    expect(screen.getByTestId("profile-st")).toBeInTheDocument();
    expect(screen.queryByTestId("profile-ra")).not.toBeInTheDocument();
    const panel = screen.getByRole("tabpanel");
    expect(panel.getAttribute("aria-labelledby")).toBe(screen.getByRole("tab", { name: "Steam" }).id);
  });

  test("remembers the chosen tab", () => {
    bothAccounts();
    const { unmount } = renderProfile();
    fireEvent.click(screen.getByRole("tab", { name: "Steam" }));
    unmount();

    renderProfile();
    expect(screen.getByTestId("profile-st")).toBeInTheDocument();
  });

  test("with RA only there are no tabs — and no connect prompt either", () => {
    (useSession as jest.Mock).mockReturnValue({ data: { user: { raUser: { User: "Ivan" } } } });
    renderProfile();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByTestId("profile-ra")).toBeInTheDocument();
    expect(screen.queryByTestId("profile-st")).not.toBeInTheDocument();
  });
});
