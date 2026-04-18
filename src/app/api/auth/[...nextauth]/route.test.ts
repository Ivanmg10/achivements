jest.mock("next-auth", () => {
  const handler = jest.fn();
  return { __esModule: true, default: jest.fn(() => handler) };
});

jest.mock("@/lib/authOptions", () => ({
  authOptions: {},
}));

import { GET, POST } from "./route";

test("GET and POST handlers are exported", () => {
  expect(typeof GET).toBe("function");
  expect(typeof POST).toBe("function");
  expect(GET).toBe(POST);
});
