import { render, screen, fireEvent } from "@testing-library/react";
import CommonModal from "./CommonModal";

test("does not render when closed", () => {
  const { container } = render(
    <CommonModal isOpen={false} onClose={jest.fn()}>
      <p>Content</p>
    </CommonModal>,
  );
  expect(container.firstChild).toBeNull();
});

test("renders children when open", () => {
  render(
    <CommonModal isOpen={true} onClose={jest.fn()}>
      <p>Modal Content</p>
    </CommonModal>,
  );
  expect(screen.getByText("Modal Content")).toBeInTheDocument();
});

test("calls onClose when backdrop clicked", () => {
  const onClose = jest.fn();
  const { container } = render(
    <CommonModal isOpen={true} onClose={onClose}>
      <p>Content</p>
    </CommonModal>,
  );
  fireEvent.click(container.firstChild!);
  expect(onClose).toHaveBeenCalled();
});

test("does not call onClose when inner div clicked", () => {
  const onClose = jest.fn();
  render(
    <CommonModal isOpen={true} onClose={onClose}>
      <p>Content</p>
    </CommonModal>,
  );
  fireEvent.click(screen.getByText("Content").parentElement!);
  expect(onClose).not.toHaveBeenCalled();
});
