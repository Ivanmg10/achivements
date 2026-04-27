import { CONSOLES, CATEGORIES } from "./index";

test("CONSOLES has 8 entries", () => {
  expect(CONSOLES.length).toBe(8);
  expect(CONSOLES[0]).toHaveProperty("name");
  expect(CONSOLES[0]).toHaveProperty("id");
  expect(CONSOLES[0]).toHaveProperty("icon");
});

test("CATEGORIES has 3 entries", () => {
  expect(CATEGORIES.length).toBe(3);
  expect(CATEGORIES[0]).toHaveProperty("label");
  expect(CATEGORIES[0]).toHaveProperty("slug");
});
