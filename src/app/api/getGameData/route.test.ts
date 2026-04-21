import { GET } from "./route";
import { NextRequest } from "next/server";

global.fetch = jest.fn();

beforeEach(() => {
  process.env.RA_API_KEY = "testkey";
  (fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve({ ID: 1, Title: "Test Game" }),
  });
});

test("GET returns game data", async () => {
  const req = new NextRequest("http://localhost/api/getGameData?gameId=123");
  const res = await GET(req);
  expect(res.data).toEqual({ ID: 1, Title: "Test Game" });
});
