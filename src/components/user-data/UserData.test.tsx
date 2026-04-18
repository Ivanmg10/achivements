jest.mock("@/components/ra-login-modal/RaLoginModal", () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="ra-modal">Modal</div> : null,
}));

import { render, screen, fireEvent } from "@testing-library/react";
import UserData from "./UserData";

const mockSession = {
  user: {
    name: "Ivan",
    email: "ivan@test.com",
    theme: "dark",
    avatar: null,
    raUser: null,
  },
} as any;

test("renders user info", () => {
  render(<UserData session={mockSession} />);
  expect(screen.getByText(/Ivan/)).toBeInTheDocument();
  expect(screen.getByText(/ivan@test.com/)).toBeInTheDocument();
});

test("renders RA login button when no raUser", () => {
  render(<UserData session={mockSession} />);
  expect(screen.getAllByText("Iniciar sesion en Retroachivements").length).toBeGreaterThan(0);
});

test("opens RA modal on button click", () => {
  render(<UserData session={mockSession} />);
  const buttons = screen.getAllByText("Iniciar sesion en Retroachivements");
  fireEvent.click(buttons[0]);
  expect(screen.getByTestId("ra-modal")).toBeInTheDocument();
});

test("renders RA user info when raUser present", () => {
  const session = {
    ...mockSession,
    user: {
      ...mockSession.user,
      raUser: { User: "IvanXMarine", UserPic: "/pic.png", ULID: "ulid", TotalPoints: 100, TotalSoftcorePoints: 200 },
    },
  } as any;
  render(<UserData session={session} />);
  expect(screen.getByText("IvanXMarine")).toBeInTheDocument();
});

test("renders user avatar when provided", () => {
  const session = {
    ...mockSession,
    user: { ...mockSession.user, avatar: "https://example.com/avatar.jpg" },
  } as any;
  render(<UserData session={session} />);
  const img = screen.getByAltText("UserPic");
  expect(img).toBeInTheDocument();
});

test("renders without session", () => {
  render(<UserData session={null} />);
  expect(screen.queryByText("Ivan")).not.toBeInTheDocument();
});
