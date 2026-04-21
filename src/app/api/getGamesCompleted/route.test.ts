import { GET } from "./route";
import { getServerSession } from "next-auth";

jest.mock("@/lib/authOptions", () => ({ authOptions: {} }));

global.fetch = jest.fn();

const mockSession = {
  user: { id: "1", rausername: "user", raid: "key" },
};

beforeEach(() => {
  (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  (fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve([{ GameID: 1, Title: "Game" }]),
  });
});

test("GET returns completed games", async () => {
  const res = await GET();
  expect(res.data).toEqual([{ GameID: 1, Title: "Game" }]);
});

test("GET returns 401 when no session", async () => {
  (getServerSession as jest.Mock).mockResolvedValue(null);
  const res = await GET();
  expect(res.status).toBe(401);
});
