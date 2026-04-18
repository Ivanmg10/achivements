jest.mock("@/lib/db", () => {
  const query = jest.fn();
  return { __esModule: true, default: { query } };
});

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/authOptions", () => ({
  authOptions: {},
}));

import { POST } from "./route";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";

beforeEach(() => {
  (pool.query as jest.Mock).mockResolvedValue({});
});

function makeRequest(body: object) {
  return {
    json: () => Promise.resolve(body),
  } as unknown as Request;
}

test("POST returns 401 when no session", async () => {
  (getServerSession as jest.Mock).mockResolvedValue(null);
  const res = await POST(makeRequest({ raUser: { User: "ivan" } }));
  expect(res.status).toBe(401);
});

test("POST updates RA user when authenticated", async () => {
  (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1 } });
  const res = await POST(makeRequest({ raUser: { User: "ivan" } }));
  expect(res.status).toBe(200);
  expect(res.data).toEqual({ ok: true });
});
