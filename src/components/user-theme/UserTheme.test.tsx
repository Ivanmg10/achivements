import { render, screen, fireEvent } from "@testing-library/react";
import UserTheme from "./UserTheme";
import { ThemeProvider } from "@/context/ThemeContext";
import { useSession } from "next-auth/react";

(useSession as jest.Mock).mockReturnValue({ data: null });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>;
}

test("renders theme buttons", () => {
  render(<UserTheme />, { wrapper: Wrapper });
  expect(screen.getByText("Background Color")).toBeInTheDocument();
});

test("clicking all theme buttons", () => {
  render(<UserTheme />, { wrapper: Wrapper });
  const buttons = screen.getAllByRole("button");
  buttons.forEach((btn) => fireEvent.click(btn));
});
