import { render, screen } from "@testing-library/react";
import AuthPageLayout from "./layout";

test("renders children", () => {
  render(<AuthPageLayout><p>Auth Content</p></AuthPageLayout>);
  expect(screen.getByText("Auth Content")).toBeInTheDocument();
});
