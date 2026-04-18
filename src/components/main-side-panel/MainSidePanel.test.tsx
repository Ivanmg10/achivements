import { render, screen } from "@testing-library/react";
import MainSidePanel from "./MainSidePanel";
import { useSession } from "next-auth/react";

test("renders categories and consoles", () => {
  (useSession as jest.Mock).mockReturnValue({ data: null });
  render(<MainSidePanel />);
  expect(screen.getByText("Quiero jugar")).toBeInTheDocument();
  expect(screen.getAllByText("PS2").length).toBeGreaterThan(0);
});

test("renders user welcome when raUser present", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: { User: "IvanXMarine", UserPic: "/pic.png" } } },
  });
  render(<MainSidePanel />);
  expect(screen.getByText(/IvanXMarine/)).toBeInTheDocument();
});

test("renders without raUser", () => {
  (useSession as jest.Mock).mockReturnValue({
    data: { user: { raUser: null } },
  });
  render(<MainSidePanel />);
  expect(screen.getByText("Ajustes de usuario")).toBeInTheDocument();
});
