import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { useSession } from "next-auth/react";

(useSession as jest.Mock).mockReturnValue({ data: null });

function TestConsumer() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <p data-testid="theme">{theme}</p>
      <button onClick={() => setTheme("red")}>set red</button>
    </div>
  );
}

test("provides default theme", () => {
  render(
    <ThemeProvider defaultTheme="dark">
      <TestConsumer />
    </ThemeProvider>,
  );
  expect(screen.getByTestId("theme").textContent).toBe("dark");
});

test("uses dark as default when no defaultTheme prop", () => {
  render(
    <ThemeProvider>
      <TestConsumer />
    </ThemeProvider>,
  );
  expect(screen.getByTestId("theme").textContent).toBe("dark");
});

test("setTheme updates theme", () => {
  render(
    <ThemeProvider defaultTheme="dark">
      <TestConsumer />
    </ThemeProvider>,
  );
  fireEvent.click(screen.getByText("set red"));
  expect(screen.getByTestId("theme").textContent).toBe("red");
});

test("updates document theme when session has user.theme", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { theme: "red" } },
  });
  render(
    <ThemeProvider defaultTheme="dark">
      <TestConsumer />
    </ThemeProvider>,
  );
  expect(document.documentElement.dataset.theme).toBe("red");
});

test("useTheme throws outside provider", () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  expect(() => render(<TestConsumer />)).toThrow(
    "useTheme must be used inside ThemeProvider",
  );
  consoleError.mockRestore();
});
