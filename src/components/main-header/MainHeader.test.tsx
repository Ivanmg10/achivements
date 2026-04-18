import { render, screen } from "@testing-library/react";
import MainHeader from "./MainHeader";
import { useSession } from "next-auth/react";

test("renders login button when no session", () => {
  (useSession as jest.Mock).mockReturnValue({ data: null });
  render(<MainHeader />);
  expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
});

test("renders user name when session exists", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { name: "Ivan", avatar: null } },
  });
  render(<MainHeader />);
  expect(screen.getByText("Ivan")).toBeInTheDocument();
});

test("renders user avatar when provided", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { name: "Ivan", avatar: "https://example.com/avatar.png" } },
  });
  render(<MainHeader />);
  const img = screen.getByAltText("imagen");
  expect(img).toBeInTheDocument();
});

test("renders home link", () => {
  (useSession as jest.Mock).mockReturnValue({ data: null });
  render(<MainHeader />);
  expect(screen.getByText("Home")).toBeInTheDocument();
});
