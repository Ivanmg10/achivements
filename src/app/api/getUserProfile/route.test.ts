import { GET } from "./route";
import { NextRequest } from "next/server";

global.fetch = jest.fn();

beforeEach(() => {
  (fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve({ User: "IvanXMarine", TotalPoints: 272 }),
  });
});

test("GET returns user profile", async () => {
  const req = new NextRequest(
    "http://localhost/api/getUserProfile?username=user&publicKey=key",
  );
  const res = await GET(req);
  expect(res.data).toHaveProperty("User", "IvanXMarine");
});
