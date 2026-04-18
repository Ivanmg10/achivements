jest.mock("@/components/main-page/main-page-progression/MainPageProgression", () => ({
  __esModule: true,
  default: () => <div data-testid="progression">Progression</div>,
}));

jest.mock("@/components/main-page/main-page-profile/MainPageProfile", () => ({
  __esModule: true,
  default: () => <div data-testid="profile">Profile</div>,
}));

jest.mock("@/components/main-page/main-page-want-to-play/MainPageWantToPlay", () => ({
  __esModule: true,
  default: () => <div data-testid="want-to-play">WantToPlay</div>,
}));

jest.mock("@/components/main-page/main-page-games/MainPageGames", () => ({
  __esModule: true,
  default: () => <div data-testid="games">Games</div>,
}));

jest.mock("@/components/main-page/main-page-completed/MainPageCompleted", () => ({
  __esModule: true,
  default: () => <div data-testid="completed">Completed</div>,
}));

import { render, screen } from "@testing-library/react";
import MainPage from "./MainPage";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

test("renders all sub-components when authenticated", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<MainPage />);
  expect(screen.getByTestId("progression")).toBeInTheDocument();
  expect(screen.getByTestId("profile")).toBeInTheDocument();
});

test("renders spinner when loading", () => {
  (useSession as jest.Mock).mockReturnValue({ status: "loading", data: null });
  const { container } = render(<MainPage />);
  expect(container.querySelector(".loader")).toBeInTheDocument();
});

test("redirects when unauthenticated", () => {
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push });
  (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated", data: null });
  render(<MainPage />);
  expect(push).toHaveBeenCalledWith("/authPage");
});
