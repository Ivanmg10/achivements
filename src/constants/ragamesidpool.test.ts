import { ragamesIds } from "./ragamesidpool";

test("ragamesIds is an array of strings", () => {
  expect(Array.isArray(ragamesIds)).toBe(true);
  expect(ragamesIds.length).toBeGreaterThan(0);
  expect(typeof ragamesIds[0]).toBe("string");
});
