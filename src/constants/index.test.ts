import { CONSOLES } from "./index";

test("CONSOLES entries have required fields", () => {
  expect(CONSOLES.length).toBeGreaterThan(8);
  for (const c of CONSOLES) {
    expect(c).toHaveProperty("name");
    expect(c).toHaveProperty("id");
    expect(c).toHaveProperty("icon");
  }
});

