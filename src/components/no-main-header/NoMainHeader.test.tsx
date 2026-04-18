import { render, screen } from "@testing-library/react";
import NoMainHeader from "./NoMainHeader";

test("renders back link to /", () => {
  render(<NoMainHeader />);
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", "/");
});
