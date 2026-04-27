import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterUserForm from "./RegisterUserForm";

global.fetch = jest.fn();

beforeEach(() => {
  (fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ id: 1, username: "ivan" }),
  });
});

test("renders register form", () => {
  render(<RegisterUserForm setIsLogin={jest.fn()} setIsRegister={jest.fn()} />);
  expect(screen.getByText("Registro")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Nombre de usuario")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Contraseña")).toBeInTheDocument();
});

test("clicking login button calls setIsLogin(true)", () => {
  const setIsLogin = jest.fn();
  render(<RegisterUserForm setIsLogin={setIsLogin} setIsRegister={jest.fn()} />);
  fireEvent.click(screen.getByText("¿Ya tienes cuenta? Inicia sesión"));
  expect(setIsLogin).toHaveBeenCalledWith(true);
});

test("does not redirect when api returns error", async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({ error: "Error al crear la cuenta" }),
  });
  const setIsLogin = jest.fn();
  render(<RegisterUserForm setIsLogin={setIsLogin} setIsRegister={jest.fn()} />);
  fireEvent.change(screen.getByPlaceholderText("Nombre de usuario"), {
    target: { value: "ivan" },
  });
  fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
    target: { value: "pass" },
  });
  fireEvent.click(screen.getByText("Crear cuenta"));
  await new Promise((r) => setTimeout(r, 10));
  expect(setIsLogin).not.toHaveBeenCalled();
});

test("submitting form calls API and redirects", async () => {
  const setIsLogin = jest.fn();
  const setIsRegister = jest.fn();
  render(<RegisterUserForm setIsLogin={setIsLogin} setIsRegister={setIsRegister} />);
  fireEvent.change(screen.getByPlaceholderText("Nombre de usuario"), {
    target: { value: "ivan" },
  });
  fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
    target: { value: "pass" },
  });
  fireEvent.click(screen.getByText("Crear cuenta"));
  await waitFor(() => {
    expect(setIsLogin).toHaveBeenCalledWith(true);
    expect(setIsRegister).toHaveBeenCalledWith(true);
  });
});
