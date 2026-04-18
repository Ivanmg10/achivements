import { render, screen } from "@testing-library/react";
import MainStart from "./MainStart";
import { ThemeProvider } from "@/context/ThemeContext";
import { useSession } from "next-auth/react";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>;
}

test("renders welcome message with session user", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { name: "Ivan" } },
  });
  render(<MainStart />, { wrapper: Wrapper });
  expect(screen.getByText(/Bienvenido Ivan/)).toBeInTheDocument();
});

test("renders without session", () => {
  (useSession as jest.Mock).mockReturnValue({ data: null });
  render(<MainStart />, { wrapper: Wrapper });
  expect(screen.getByText(/Bienvenido/)).toBeInTheDocument();
});
