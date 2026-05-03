import { render, screen } from "@testing-library/react";
import MainFooter from "./MainFooter";

test("renders footer brand name", () => {
  render(<MainFooter />);
  expect(screen.getByText("CheevoVault")).toBeInTheDocument();
});
