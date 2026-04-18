jest.mock("@/utils/apiCallsUtils", () => ({
  unlinkRaUser: jest.fn(),
}));

jest.mock("@/components/user-theme/UserTheme", () => ({
  __esModule: true,
  default: () => <div data-testid="user-theme">UserTheme</div>,
}));

import { render, screen, fireEvent } from "@testing-library/react";
import UserConfig from "./UserConfig";
import { useSession, signOut } from "next-auth/react";
import { unlinkRaUser } from "@/utils/apiCallsUtils";

test("renders config section", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: null } },
    update: jest.fn(),
  });
  render(<UserConfig />);
  expect(screen.getByText("Configuración de cuenta")).toBeInTheDocument();
  expect(screen.getByTestId("user-theme")).toBeInTheDocument();
});

test("shows RA sign out when raUser present", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: { User: "Ivan" } } },
    update: jest.fn(),
  });
  render(<UserConfig />);
  expect(screen.getByText("Cerrar sesion en RA")).toBeInTheDocument();
});

test("clicking sign out calls signOut", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: null } },
    update: jest.fn(),
  });
  render(<UserConfig />);
  fireEvent.click(screen.getByText("Cerrar sesion"));
  expect(signOut).toHaveBeenCalled();
});

test("clicking RA sign out calls unlinkRaUser", () => {
  const update = jest.fn();
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: { User: "Ivan" } } },
    update,
  });
  render(<UserConfig />);
  fireEvent.click(screen.getByText("Cerrar sesion en RA"));
  expect(unlinkRaUser).toHaveBeenCalledWith(update);
});
