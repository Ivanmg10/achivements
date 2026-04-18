import { GET } from "./route";
import { NextRequest } from "next/server";

global.fetch = jest.fn();

beforeEach(() => {
  (fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve([{ GameID: 1, Title: "Game" }]),
  });
});

test("GET returns completed games", async () => {
  const req = new NextRequest(
    "http://localhost/api/getGamesCompleted?username=user&publicKey=key",
  );
  const res = await GET(req);
  expect(res.data).toEqual([{ GameID: 1, Title: "Game" }]);
});
