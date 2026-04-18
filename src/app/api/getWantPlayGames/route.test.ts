import { GET } from "./route";
import { NextRequest } from "next/server";

global.fetch = jest.fn();

beforeEach(() => {
  (fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve({ Count: 1, Results: [{ ID: 1 }] }),
  });
});

test("GET returns want to play games", async () => {
  const req = new NextRequest(
    "http://localhost/api/getWantPlayGames?username=user&publicKey=key",
  );
  const res = await GET(req);
  expect(res.data).toHaveProperty("Results");
});
