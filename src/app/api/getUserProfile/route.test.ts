import { GET, POST } from "./route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

jest.mock("@/lib/authOptions", () => ({ authOptions: {} }));

global.fetch = jest.fn();

const mockSession = {
  user: { id: "1", rausername: "user", raid: "key" },
};

beforeEach(() => {
  (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  (fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve({ User: "IvanXMarine", TotalPoints: 272 }),
  });
});

test("GET returns user profile", async () => {
  const res = await GET();
  expect(res.data).toHaveProperty("User", "IvanXMarine");
});

test("GET returns 401 when no session", async () => {
  (getServerSession as jest.Mock).mockResolvedValue(null);
  const res = await GET();
  expect(res.status).toBe(401);
});

test("POST returns user profile with provided credentials", async () => {
  const req = new NextRequest("http://localhost/api/getUserProfile", {
    method: "POST",
    body: JSON.stringify({ username: "user", apiKey: "key" }),
  });
  const res = await POST(req);
  expect(res.data).toHaveProperty("User", "IvanXMarine");
});

test("POST returns 401 when no session", async () => {
  (getServerSession as jest.Mock).mockResolvedValue(null);
  const req = new NextRequest("http://localhost/api/getUserProfile", {
    method: "POST",
    body: JSON.stringify({ username: "user", apiKey: "key" }),
  });
  const res = await POST(req);
  expect(res.status).toBe(401);
});

test("POST returns 400 when missing username or apiKey", async () => {
  const req = new NextRequest("http://localhost/api/getUserProfile", {
    method: "POST",
    body: JSON.stringify({ username: "user" }),
  });
  const res = await POST(req);
  expect(res.status).toBe(400);
});
