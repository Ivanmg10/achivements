import { render, screen } from "@testing-library/react";
import MainPageProfileRa from "./MainPageProfileRa";

const mockUser = {
  ID: 1,
  User: "IvanXMarine",
  ULID: "ulid123",
  UserPic: "/UserPic/user.png",
  RichPresenceMsg: "Playing level 1",
  TotalPoints: 272,
  TotalSoftcorePoints: 2202,
  TotalTruePoints: 951,
  MemberSince: "2023-01-01",
  Motto: "",
  Permissions: 1,
  ContribCount: 0,
  ContribYield: 0,
  LastGameID: 19010,
  Untracked: 0,
  UserWallActive: 1,
};

const mockGame = {
  ID: 19010,
  Title: "Sly Cooper",
  ImageIcon: "/icon.png",
  ConsoleName: "PS2",
} as any;

test("renders user info when user present", () => {
  render(<MainPageProfileRa user={mockUser} game={mockGame} recentAchievements={[]} />);
  expect(screen.getByText("IvanXMarine")).toBeInTheDocument();
  expect(screen.getByText("272 puntos totales")).toBeInTheDocument();
  expect(screen.getByText("Playing level 1")).toBeInTheDocument();
});

test("renders login link when no user", () => {
  render(<MainPageProfileRa user={null} game={null} recentAchievements={[]} />);
  expect(screen.getByText("Iniciar sesion con Retroachivements")).toBeInTheDocument();
});

test("renders without UserPic", () => {
  render(<MainPageProfileRa user={{ ...mockUser, UserPic: undefined as any }} game={mockGame} recentAchievements={[]} />);
  expect(screen.getByText("IvanXMarine")).toBeInTheDocument();
});
