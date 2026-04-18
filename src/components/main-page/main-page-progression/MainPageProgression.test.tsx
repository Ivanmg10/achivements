jest.mock("@/utils/apiCallsUtils", () => ({
  getGamesInfoList: jest.fn(),
}));

jest.mock("@/mocks/gameProgression.json", () => [
  {
    ID: 1,
    GameTitle: "Sly Cooper",
    Title: "Sly Cooper",
    ConsoleName: "PS2",
    ImageIcon: "/icon.png",
    UserCompletion: "50%",
  },
  {
    ID: 2,
    GameTitle: "Jak and Daxter",
    Title: "Jak and Daxter",
    ConsoleName: "PS2",
    ImageIcon: "/icon2.png",
    UserCompletion: "75%",
  },
], { virtual: true });

import { render, screen } from "@testing-library/react";
import MainPageProgression from "./MainPageProgression";
import { useSession } from "next-auth/react";

test("renders progression section", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<MainPageProgression />);
  expect(screen.getByText("Tus progresos recientes")).toBeInTheDocument();
});

test("renders games when authenticated", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<MainPageProgression />);
  expect(screen.getByText("Sly Cooper")).toBeInTheDocument();
});

test("hasFetched guard prevents double fetch", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  const { rerender } = render(<MainPageProgression />);
  (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated", data: null });
  rerender(<MainPageProgression />);
  expect(screen.getByText("Tus progresos recientes")).toBeInTheDocument();
});
