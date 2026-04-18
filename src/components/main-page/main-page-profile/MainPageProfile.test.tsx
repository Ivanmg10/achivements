jest.mock("@/utils/apiCallsUtils", () => ({
  getGamesInfo: jest.fn(),
}));

jest.mock("@/components/main-page/main-page-profile/main-page-profile-ra/MainPageProfileRa", () => ({
  __esModule: true,
  default: () => <div data-testid="profile-ra">ProfileRa</div>,
}));

jest.mock("@/components/main-page/main-page-profile/main-page-profile-st/MainPageProfileSt", () => ({
  __esModule: true,
  default: () => <div data-testid="profile-st">ProfileSt</div>,
}));

import { render, screen } from "@testing-library/react";
import MainPageProfile from "./MainPageProfile";
import { useSession } from "next-auth/react";

test("renders profile sub-components", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: { User: "Ivan", LastGameID: 19010 } } },
  });
  render(<MainPageProfile />);
  expect(screen.getByTestId("profile-ra")).toBeInTheDocument();
  expect(screen.getByTestId("profile-st")).toBeInTheDocument();
});

test("renders without raUser", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: null } },
  });
  render(<MainPageProfile />);
  expect(screen.getByTestId("profile-ra")).toBeInTheDocument();
});
