import { render, screen } from "@testing-library/react";
import Providers from "./providers";
import { useSession } from "next-auth/react";

(useSession as jest.Mock).mockReturnValue({ data: null });

test("renders children inside providers", () => {
  render(
    <Providers>
      <p>Test Child</p>
    </Providers>,
  );
  expect(screen.getByText("Test Child")).toBeInTheDocument();
});
