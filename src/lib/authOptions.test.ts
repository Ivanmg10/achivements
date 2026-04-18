jest.mock("@/lib/db", () => {
  const query = jest.fn();
  return { __esModule: true, default: { query } };
});

jest.mock("bcrypt", () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

import { authOptions } from "./authOptions";
import bcrypt from "bcrypt";
import pool from "@/lib/db";

const mockUser = {
  id: 1,
  username: "ivan",
  password: "hashedpass",
  theme: "dark",
  avatar: null,
  raId: null,
  raUser: null,
  email: "ivan@test.com",
  raid: null,
  rausername: null,
  steamid: null,
  steamusername: null,
  admin: false,
};

beforeEach(() => {
  (pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });
  (bcrypt.compare as jest.Mock).mockResolvedValue(true);
});

const credentialsProvider = authOptions.providers[0] as any;

test("authOptions has CredentialsProvider", () => {
  expect(authOptions.providers.length).toBeGreaterThan(0);
});

test("authorize returns user on valid credentials", async () => {
  const user = await credentialsProvider.options.authorize({ username: "ivan", password: "pass" });
  expect(user).toHaveProperty("name", "ivan");
});

test("authorize returns null when no user found", async () => {
  (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
  const user = await credentialsProvider.options.authorize({ username: "none", password: "x" });
  expect(user).toBeNull();
});

test("authorize returns null when password mismatch", async () => {
  (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
  const user = await credentialsProvider.options.authorize({ username: "ivan", password: "wrong" });
  expect(user).toBeNull();
});

test("authorize returns null when no credentials", async () => {
  const user = await credentialsProvider.options.authorize(null);
  expect(user).toBeNull();
});

test("jwt callback adds user fields", async () => {
  const jwtCallback = authOptions.callbacks?.jwt as any;
  const token = await jwtCallback({
    token: {},
    user: { id: "1", theme: "dark", avatar: null, raUser: null, rausername: "ivan", raid: "key" },
  });
  expect(token.id).toBe("1");
  expect(token.theme).toBe("dark");
});

test("jwt callback skips when no user", async () => {
  const jwtCallback = authOptions.callbacks?.jwt as any;
  const token = await jwtCallback({ token: { id: 99 }, user: undefined });
  expect(token.id).toBe(99);
});

test("jwt callback handles update trigger", async () => {
  const jwtCallback = authOptions.callbacks?.jwt as any;
  const token = await jwtCallback({
    token: { raUser: {} },
    user: undefined,
    trigger: "update",
    session: { raUser: { User: "ivan" } },
  });
  expect(token.raUser).toEqual({ User: "ivan" });
});

test("jwt callback handles update trigger with null raUser in session", async () => {
  const jwtCallback = authOptions.callbacks?.jwt as any;
  const token = await jwtCallback({
    token: { raUser: { User: "old" } },
    user: undefined,
    trigger: "update",
    session: { raUser: null },
  });
  expect(token.raUser).toEqual({});
});

test("session callback skips when no token", async () => {
  const sessionCallback = authOptions.callbacks?.session as any;
  const originalSession = { user: { name: "unchanged" } };
  const session = await sessionCallback({ session: originalSession, token: null });
  expect(session.user.name).toBe("unchanged");
});

test("session callback populates session user", async () => {
  const sessionCallback = authOptions.callbacks?.session as any;
  const session = await sessionCallback({
    session: { user: {} },
    token: { id: 1, theme: "dark", avatar: null, raUser: null, rausername: "ivan", raid: "key" },
  });
  expect(session.user.id).toBe(1);
  expect(session.user.theme).toBe("dark");
});
