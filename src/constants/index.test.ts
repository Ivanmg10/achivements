import { CONSOLES, CATEGORIES } from "./index";

test("CONSOLES entries have required fields", () => {
  expect(CONSOLES.length).toBeGreaterThan(8);
  for (const c of CONSOLES) {
    expect(c).toHaveProperty("name");
    expect(c).toHaveProperty("id");
    expect(c).toHaveProperty("icon");
  }
});

test("CATEGORIES has 3 entries", () => {
  expect(CATEGORIES.length).toBe(3);
  expect(CATEGORIES[0]).toHaveProperty("label");
  expect(CATEGORIES[0]).toHaveProperty("slug");
});
