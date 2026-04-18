jest.mock("pg", () => {
  const query = jest.fn().mockResolvedValue({ rows: [] });
  const Pool = jest.fn(() => ({ query }));
  return { __esModule: true, default: { Pool } };
});

test("db exports a pool instance", async () => {
  const pool = (await import("./db")).default;
  expect(pool).toBeDefined();
  expect(typeof pool.query).toBe("function");
});
