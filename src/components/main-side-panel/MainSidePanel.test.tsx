global.fetch = jest.fn();

import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MainSidePanel from "./MainSidePanel";
import { useSession } from "next-auth/react";

beforeEach(() => {
  (fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve([]),
  });
});

test("renders categories and consoles", () => {
  (useSession as jest.Mock).mockReturnValue({ data: null });
  render(<MainSidePanel />);
  expect(screen.getByText("Quiero jugar")).toBeInTheDocument();
});

test("renders user welcome when raUser present", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: {
      user: {
        raUser: {
          User: "IvanXMarine",
          UserPic: "/pic.png",
          TotalPoints: 272,
          TotalSoftcorePoints: 2202,
        },
      },
    },
  });
  render(<MainSidePanel />);
  expect(screen.getByText(/IvanXMarine/)).toBeInTheDocument();
  expect(screen.getByText("272")).toBeInTheDocument();
});

test("renders without raUser", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: null } },
  });
  render(<MainSidePanel />);
  expect(screen.getByText("Ajustes de usuario")).toBeInTheDocument();
});

test("fetches recent achievements when rausername set", async () => {
  const achievements = [
    {
      Date: new Date().toISOString().replace("T", " ").slice(0, 19),
      HardcoreMode: "0",
      AchievementID: 1,
      Title: "Speed Demon",
      Description: "desc",
      BadgeName: "12345",
      Points: 10,
      GameID: 1,
      GameTitle: "NFS Carbon",
      ConsoleName: "PS2",
    },
  ];
  (fetch as jest.Mock).mockResolvedValueOnce({
    json: () => Promise.resolve(achievements),
  });
  (useSession as jest.Mock).mockReturnValue({
    data: {
      user: {
        rausername: "ivan",
        raUser: { User: "ivan", TotalPoints: 100, TotalSoftcorePoints: 200 },
      },
    },
  });
  await act(async () => {
    render(<MainSidePanel />);
  });
  expect(fetch).toHaveBeenCalledWith("/api/getRecentAchievements");
  expect(screen.getByText("Speed Demon")).toBeInTheDocument();
  expect(screen.getAllByText("NFS Carbon").length).toBeGreaterThan(0);
});

test("search filters consoles and expands categories", async () => {
  (useSession as jest.Mock).mockReturnValue({ data: null });
  render(<MainSidePanel />);
  const input = screen.getByPlaceholderText("Buscar consola…");
  await userEvent.type(input, "PS2");
  expect(screen.getAllByText("PS2").length).toBeGreaterThan(0);
  expect(screen.queryByText("Game Boy Advance")).not.toBeInTheDocument();
});

test("shows no results when search matches nothing", async () => {
  (useSession as jest.Mock).mockReturnValue({ data: null });
  render(<MainSidePanel />);
  const input = screen.getByPlaceholderText("Buscar consola…");
  await userEvent.type(input, "zzzznotfound");
  expect(screen.getAllByText("Sin resultados").length).toBeGreaterThan(0);
});
