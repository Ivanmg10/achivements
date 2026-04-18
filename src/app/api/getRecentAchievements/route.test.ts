import { GET } from "./route";
import { NextRequest } from "next/server";

global.fetch = jest.fn();

beforeEach(() => {
  (fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve([{ AchievementID: 1, Title: "Trophy" }]),
  });
});

test("GET returns recent achievements", async () => {
  const req = new NextRequest(
    "http://localhost/api/getRecentAchievements?username=user&publicKey=key",
  );
  const res = await GET(req);
  expect(res.data).toEqual([{ AchievementID: 1, Title: "Trophy" }]);
});
