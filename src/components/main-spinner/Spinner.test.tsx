import { render, container } from "@testing-library/react";
import Spinner from "./Spinner";

test("renders with default size", () => {
  const { container } = render(<Spinner />);
  const el = container.querySelector(".loader");
  expect(el).toBeInTheDocument();
  expect((el as HTMLElement).style.fontSize).toBe("45px");
});

test("renders with custom size", () => {
  const { container } = render(<Spinner size={20} />);
  const el = container.querySelector(".loader");
  expect((el as HTMLElement).style.fontSize).toBe("20px");
});
