import { GET } from "./route";
import { NextRequest } from "next/server";

global.fetch = jest.fn();

beforeEach(() => {
  (fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve({ ID: 1, Title: "Test Game", UserCompletion: "50%" }),
  });
});

test("GET returns game progression", async () => {
  const req = new NextRequest(
    "http://localhost/api/getGameProgression?username=user&publicKey=key&gameId=123",
  );
  const res = await GET(req);
  expect(res.data).toHaveProperty("UserCompletion");
});
