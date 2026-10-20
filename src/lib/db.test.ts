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

test("a preview database wins everywhere but production", async () => {
  const { databaseUrl } = await import("./db");
  expect(databaseUrl({ DATABASE_URL: "prod" })).toBe("prod");
  expect(databaseUrl({ DATABASE_URL: "prod", PREVIEW_DATABASE_URL: "pre", VERCEL_ENV: "preview" })).toBe("pre");
  expect(databaseUrl({ DATABASE_URL: "prod", PREVIEW_DATABASE_URL: "pre" })).toBe("pre");
  // Set on production by mistake, it is ignored.
  expect(databaseUrl({ DATABASE_URL: "prod", PREVIEW_DATABASE_URL: "pre", VERCEL_ENV: "production" })).toBe("prod");
});
