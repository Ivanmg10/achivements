import { GET } from "./route";
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
    json: () => Promise.resolve({ ID: 1, Title: "Test Game", UserCompletion: "50%" }),
  });
});

test("GET returns game progression", async () => {
  const req = new NextRequest(
    "http://localhost/api/getGameProgression?gameId=123",
  );
  const res = await GET(req);
  expect(res.data).toHaveProperty("UserCompletion");
});

test("GET returns 401 when no session", async () => {
  (getServerSession as jest.Mock).mockResolvedValue(null);
  const req = new NextRequest(
    "http://localhost/api/getGameProgression?gameId=123",
  );
  const res = await GET(req);
  expect(res.status).toBe(401);
});
