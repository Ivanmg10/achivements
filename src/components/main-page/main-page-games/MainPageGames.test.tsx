jest.mock("@/mocks/recomendedGames6.json", () => [
  {
    GameTitle: "Sly Cooper",
    Title: "Sly Cooper",
    ConsoleID: 21,
    ConsoleName: "PS2",
    ImageIcon: "/icon.png",
    ID: "1",
  },
], { virtual: true });

import { render, screen } from "@testing-library/react";
import MainPageRecommended from "./MainPageGames";
import { useSession } from "next-auth/react";

test("renders recommended section title", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<MainPageRecommended />);
  expect(screen.getByText("Estoy jugando")).toBeInTheDocument();
});

test("renders games list when authenticated", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  render(<MainPageRecommended />);
  expect(screen.getByText("Sly Cooper")).toBeInTheDocument();
});

test("hasFetched guard prevents double fetch", () => {
  (useSession as jest.Mock).mockReturnValue({
    status: "authenticated",
    data: { user: {} },
  });
  const { rerender } = render(<MainPageRecommended />);
  (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated", data: null });
  rerender(<MainPageRecommended />);
  expect(screen.getByText("Estoy jugando")).toBeInTheDocument();
});
