jest.mock("@/constants", () => ({ USE_MOCK: false }));
jest.mock("@/mocks/userRA.json", () => ({ User: "MockUser", TotalPoints: 100 }), {
  virtual: true,
});
jest.mock(
  "@/mocks/wantToPlay.json",
  () => ({ Count: 2, Total: 2, Results: [{ ID: 1 }, { ID: 2 }] }),
  { virtual: true },
);

import {
  getGamesInfo,
  getGamesInfoList,
  getUserInfo,
  unlinkRaUser,
  getGamesCompleted,
  getAllGamesPlayed,
  groupByConsole,
  getWantGames,
  getRecentAchievements,
} from "./apiCallsUtils";

global.fetch = jest.fn();

const mockSession = {
  user: { rausername: "ivan", raid: "key" },
} as any;

beforeEach(() => {
  (fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve({}),
  });
});

test("getGamesInfo calls setGameData", async () => {
  const setGameData = jest.fn();
  (fetch as jest.Mock).mockResolvedValueOnce({
    json: () => Promise.resolve({ ID: 1, Title: "Game" }),
  });
  await getGamesInfo("123", mockSession, setGameData);
  expect(setGameData).toHaveBeenCalledWith({ ID: 1, Title: "Game" });
});

test("getGamesInfoList appends to state", async () => {
  const setGames = jest.fn();
  (fetch as jest.Mock).mockResolvedValueOnce({
    json: () => Promise.resolve({ ID: 2, Title: "Game2" }),
  });
  await getGamesInfoList("456", mockSession, setGames);
  expect(setGames).toHaveBeenCalled();
  const updater = (setGames as jest.Mock).mock.calls[0][0];
  expect(updater([{ ID: 1 }])).toEqual([{ ID: 1 }, { ID: 2, Title: "Game2" }]);
});

test("getUserInfo fetches from API when USE_MOCK is false", async () => {
  const setUser = jest.fn();
  (fetch as jest.Mock).mockResolvedValueOnce({
    json: () => Promise.resolve({ User: "ivan" }),
  });
  await getUserInfo(setUser, mockSession);
  expect(setUser).toHaveBeenCalledWith({ User: "ivan" });
});

test("getUserInfo uses mock when USE_MOCK is true", async () => {
  jest.resetModules();
  jest.mock("@/constants", () => ({ USE_MOCK: true }));
  jest.mock("@/mocks/userRA.json", () => ({ User: "MockUser" }), { virtual: true });
  jest.mock("@/mocks/wantToPlay.json", () => ({ Results: [] }), { virtual: true });
  const { getUserInfo: getUserInfoMock } = await import("./apiCallsUtils");
  const setUser = jest.fn();
  await getUserInfoMock(setUser, null);
  expect(setUser).toHaveBeenCalledWith({ User: "MockUser" });
});

test("unlinkRaUser calls fetch and update", async () => {
  const update = jest.fn().mockResolvedValue(null);
  await unlinkRaUser(update);
  expect(fetch).toHaveBeenCalledWith(
    "/api/updateRaUser",
    expect.objectContaining({ method: "POST" }),
  );
  expect(update).toHaveBeenCalledWith({ raUser: {} });
});

test("getGamesCompleted filters and sets games", async () => {
  const games = [
    { HardcoreMode: "0", PctWon: "1.0000", GameID: 1 },
    { HardcoreMode: "1", PctWon: "1.0000", GameID: 2 },
    { HardcoreMode: "0", PctWon: "0.5000", GameID: 3 },
  ];
  (fetch as jest.Mock).mockResolvedValueOnce({ json: () => Promise.resolve(games) });
  const setGames = jest.fn();
  const setHardcore = jest.fn();
  await getGamesCompleted(mockSession, setGames as any, setHardcore as any);
  expect(setGames).toHaveBeenCalledWith([{ HardcoreMode: "0", PctWon: "1.0000", GameID: 1 }]);
  expect(setHardcore).toHaveBeenCalledWith([{ HardcoreMode: "1", PctWon: "1.0000", GameID: 2 }]);
});

test("getAllGamesPlayed splits softcore/hardcore", async () => {
  const games = [
    { HardcoreMode: "0", GameID: 1 },
    { HardcoreMode: "1", GameID: 2 },
  ];
  (fetch as jest.Mock).mockResolvedValueOnce({ json: () => Promise.resolve(games) });
  const setGames = jest.fn();
  const setHardcore = jest.fn();
  await getAllGamesPlayed(mockSession, setGames as any, setHardcore as any);
  expect(setGames).toHaveBeenCalledWith([{ HardcoreMode: "0", GameID: 1 }]);
  expect(setHardcore).toHaveBeenCalledWith([{ HardcoreMode: "1", GameID: 2 }]);
});

test("getAllGamesPlayed returns early when not array", async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({ json: () => Promise.resolve(null) });
  const setGames = jest.fn();
  const setHardcore = jest.fn();
  await getAllGamesPlayed(mockSession, setGames as any, setHardcore as any);
  expect(setGames).not.toHaveBeenCalled();
});

test("groupByConsole groups games by console", () => {
  const games = [
    { ConsoleName: "PS2", GameID: 1 },
    { ConsoleName: "PS2", GameID: 2 },
    { ConsoleName: "GBA", GameID: 3 },
  ] as any;
  const result = groupByConsole(games);
  expect(result).toContainEqual({ name: "PS2", value: 2 });
  expect(result).toContainEqual({ name: "GBA", value: 1 });
});

test("getWantGames uses mock when USE_MOCK is true", async () => {
  jest.resetModules();
  jest.mock("@/constants", () => ({ USE_MOCK: true }));
  jest.mock(
    "@/mocks/wantToPlay.json",
    () => ({ Results: [{ ID: 1 }, { ID: 2 }, { ID: 3 }, { ID: 4 }, { ID: 5 }, { ID: 6 }, { ID: 7 }] }),
    { virtual: true },
  );
  jest.mock("@/mocks/userRA.json", () => ({}), { virtual: true });
  const { getWantGames: getWantGamesMock } = await import("./apiCallsUtils");
  const setWantGames = jest.fn();
  const setError = jest.fn();
  await getWantGamesMock(null, setWantGames, setError);
  expect(setWantGames).toHaveBeenCalled();
  expect(setError).not.toHaveBeenCalled();
});

test("getWantGames calls API when USE_MOCK false", async () => {
  const results = [{ ID: 1 }, { ID: 2 }];
  (fetch as jest.Mock).mockResolvedValueOnce({
    json: () => Promise.resolve({ Results: results }),
  });
  const setWantGames = jest.fn();
  const setError = jest.fn();
  await getWantGames(mockSession, setWantGames, setError);
  expect(setWantGames).toHaveBeenCalled();
});

test("getWantGames handles games without Results field", async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    json: () => Promise.resolve({}),
  });
  const setWantGames = jest.fn();
  const setError = jest.fn();
  await getWantGames(mockSession, setWantGames, setError);
  expect(setWantGames).toHaveBeenCalledWith([]);
});

test("getWantGames handles Error exception", async () => {
  (fetch as jest.Mock).mockRejectedValueOnce(new Error("network error"));
  const setWantGames = jest.fn();
  const setError = jest.fn();
  await getWantGames(mockSession, setWantGames, setError);
  expect(setError).toHaveBeenCalledWith("network error");
});

test("getWantGames handles non-Error exception", async () => {
  (fetch as jest.Mock).mockRejectedValueOnce("unknown");
  const setWantGames = jest.fn();
  const setError = jest.fn();
  await getWantGames(mockSession, setWantGames, setError);
  expect(setError).toHaveBeenCalledWith("Unknown error");
});

test("getRecentAchievements calls setAchievements", async () => {
  const data = [{ AchievementID: 1, Date: "2024-01-01 10:00:00" }];
  (fetch as jest.Mock).mockResolvedValueOnce({ json: () => Promise.resolve(data) });
  const setAchievements = jest.fn();
  await getRecentAchievements(mockSession, setAchievements);
  expect(setAchievements).toHaveBeenCalledWith(data);
});
