jest.mock("@/lib/db", () => {
  const query = jest.fn();
  return { __esModule: true, default: { query } };
});

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword"),
}));

import { POST } from "./route";
import { NextRequest } from "next/server";
import pool from "@/lib/db";

const mockUser = {
  id: 1,
  username: "ivan",
  raId: null,
  theme: "dark",
  avatar: null,
};

beforeEach(() => {
  (pool.query as jest.Mock).mockResolvedValue({ rows: [{ ...mockUser }] });
});

test("POST creates user and returns 201", async () => {
  const req = new NextRequest("http://localhost/api/users", {
    method: "POST",
    body: JSON.stringify({ username: "ivan", password: "pass123" }),
    headers: { "Content-Type": "application/json" },
  });
  const res = await POST(req);
  expect(res.status).toBe(201);
  expect(res.data).not.toHaveProperty("password");
});

test("POST returns 400 when username missing", async () => {
  const req = new NextRequest("http://localhost/api/users", {
    method: "POST",
    body: JSON.stringify({ password: "pass123" }),
    headers: { "Content-Type": "application/json" },
  });
  const res = await POST(req);
  expect(res.status).toBe(400);
});

test("POST returns 400 when password missing", async () => {
  const req = new NextRequest("http://localhost/api/users", {
    method: "POST",
    body: JSON.stringify({ username: "ivan" }),
    headers: { "Content-Type": "application/json" },
  });
  const res = await POST(req);
  expect(res.status).toBe(400);
});

test("POST returns 500 on db error", async () => {
  (pool.query as jest.Mock).mockRejectedValueOnce(new Error("DB error"));
  const req = new NextRequest("http://localhost/api/users", {
    method: "POST",
    body: JSON.stringify({ username: "ivan", password: "pass" }),
    headers: { "Content-Type": "application/json" },
  });
  const res = await POST(req);
  expect(res.status).toBe(500);
});
