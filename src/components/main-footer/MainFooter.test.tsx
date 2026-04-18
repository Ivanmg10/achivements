import { render, screen } from "@testing-library/react";
import MainFooter from "./MainFooter";

test("renders footer text", () => {
  render(<MainFooter />);
  expect(screen.getByText("© 2025 Achivements")).toBeInTheDocument();
});
