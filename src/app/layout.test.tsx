jest.mock("@/app/providers", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { render, screen } from "@testing-library/react";
import RootLayout, { metadata } from "./layout";
import { SITE_NAME } from "@/lib/siteUrl";

const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

afterAll(() => consoleError.mockRestore());

test("renders children in layout", () => {
  render(<RootLayout><p>Content</p></RootLayout>);
  expect(screen.getByText("Content")).toBeInTheDocument();
});

describe("metadata", () => {
  const title = metadata.title as { default: string; template: string };

  test("the default title says what the site is, not only what it is called", () => {
    // Nobody searches the name of a site they have never heard of.
    expect(title.default).toContain(SITE_NAME);
    expect(title.default).toMatch(/RetroAchievements/i);
    expect(title.default).toMatch(/Steam/i);
  });

  test("the title stays short enough for a result to show it whole", () => {
    expect(title.default.length).toBeLessThanOrEqual(65);
  });

  test("inner pages keep their own name, with the site after it", () => {
    expect(title.template).toBe(`%s · ${SITE_NAME}`);
  });

  test("link previews carry the same title as the search result", () => {
    expect(metadata.openGraph?.title).toBe(title.default);
    expect((metadata.twitter as { title?: string })?.title).toBe(title.default);
  });
});
