import { render, screen, fireEvent } from "@testing-library/react";
import LoginUserForm from "./LoginUserForm";
import { signIn } from "next-auth/react";

test("renders login form", () => {
  render(<LoginUserForm setIsLogin={jest.fn()} isRegister={false} />);
  expect(screen.getByText("Inicia sesión")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Usuario")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Contraseña")).toBeInTheDocument();
});

test("shows success message when isRegister is true", () => {
  render(<LoginUserForm setIsLogin={jest.fn()} isRegister={true} />);
  expect(screen.getByText("Cuenta creada correctamente")).toBeInTheDocument();
});

test("clicking register button calls setIsLogin(false)", () => {
  const setIsLogin = jest.fn();
  render(<LoginUserForm setIsLogin={setIsLogin} isRegister={false} />);
  fireEvent.click(screen.getByText("¿No tienes cuenta? Regístrate"));
  expect(setIsLogin).toHaveBeenCalledWith(false);
});

test("submitting form calls signIn", async () => {
  (signIn as jest.Mock).mockResolvedValue(null);
  render(<LoginUserForm setIsLogin={jest.fn()} isRegister={false} />);
  fireEvent.change(screen.getByPlaceholderText("Usuario"), {
    target: { value: "ivan" },
  });
  fireEvent.change(screen.getByPlaceholderText("Contraseña"), {
    target: { value: "pass" },
  });
  fireEvent.click(screen.getByText("Iniciar sesión"));
  await Promise.resolve();
  expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ username: "ivan" }));
});
