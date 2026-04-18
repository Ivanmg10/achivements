import { render, screen } from "@testing-library/react";
import MainPageProfileSt from "./MainPageProfileSt";

test("renders Steam login link", () => {
  render(<MainPageProfileSt />);
  expect(screen.getByText("Steam")).toBeInTheDocument();
  expect(screen.getByText("Iniciar sesion con Steam")).toBeInTheDocument();
});
