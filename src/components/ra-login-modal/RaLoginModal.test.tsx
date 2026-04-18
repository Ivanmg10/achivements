import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RaLoginModal from "./RaLoginModal";
import { useSession } from "next-auth/react";

global.fetch = jest.fn();

const mockUpdate = jest.fn();

beforeEach(() => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: {} },
    update: mockUpdate,
  });
  (fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve({ User: "ivan" }),
  });
  mockUpdate.mockResolvedValue(null);
});

test("does not render when closed", () => {
  const { container } = render(
    <RaLoginModal isOpen={false} setIsOpen={jest.fn()} />,
  );
  expect(container.firstChild).toBeNull();
});

test("renders form when open", () => {
  render(<RaLoginModal isOpen={true} setIsOpen={jest.fn()} />);
  expect(screen.getByPlaceholderText("Usuario")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("apiKey")).toBeInTheDocument();
});

test("submitting with empty fields does nothing", async () => {
  render(<RaLoginModal isOpen={true} setIsOpen={jest.fn()} />);
  fireEvent.click(screen.getByText("Iniciar sesion"));
  expect(fetch).not.toHaveBeenCalled();
});

test("successful login closes modal", async () => {
  const setIsOpen = jest.fn();
  render(<RaLoginModal isOpen={true} setIsOpen={setIsOpen} />);
  fireEvent.change(screen.getByPlaceholderText("Usuario"), {
    target: { value: "ivan" },
  });
  fireEvent.change(screen.getByPlaceholderText("apiKey"), {
    target: { value: "apikey123" },
  });
  fireEvent.click(screen.getByText("Iniciar sesion"));
  await waitFor(() => expect(setIsOpen).toHaveBeenCalledWith(false));
});

test("closes modal via backdrop (onClose)", () => {
  const setIsOpen = jest.fn();
  const { container } = render(<RaLoginModal isOpen={true} setIsOpen={setIsOpen} />);
  fireEvent.click(container.firstChild!);
  expect(setIsOpen).toHaveBeenCalledWith(false);
});

test("shows alert and resets form on error message", async () => {
  window.alert = jest.fn();
  (fetch as jest.Mock).mockResolvedValueOnce({
    json: () => Promise.resolve({ message: "Invalid credentials" }),
  });
  render(<RaLoginModal isOpen={true} setIsOpen={jest.fn()} />);
  fireEvent.change(screen.getByPlaceholderText("Usuario"), {
    target: { value: "ivan" },
  });
  fireEvent.change(screen.getByPlaceholderText("apiKey"), {
    target: { value: "badkey" },
  });
  fireEvent.click(screen.getByText("Iniciar sesion"));
  await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Invalid credentials"));
});
