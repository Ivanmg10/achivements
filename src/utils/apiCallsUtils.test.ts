import {
  getGamesInfo,
  getGamesInfoList,
  getUserInfo,
  unlinkRaUser,
  getGamesCompleted,
  getGamesInProgress,
  getAllGamesPlayed,
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

test("getUserInfo fetches from API", async () => {
  const setUser = jest.fn();
  (fetch as jest.Mock).mockResolvedValueOnce({
    json: () => Promise.resolve({ User: "ivan" }),
  });
  await getUserInfo(setUser, mockSession);
  expect(setUser).toHaveBeenCalledWith({ User: "ivan" });
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

test("getGamesCompleted excludes softcore entry when same GameID beaten in hardcore", async () => {
  const games = [
    { HardcoreMode: "0", PctWon: "1.0000", GameID: 5 },
    { HardcoreMode: "1", PctWon: "1.0000", GameID: 5 },
  ];
  (fetch as jest.Mock).mockResolvedValueOnce({ json: () => Promise.resolve(games) });
  const setGames = jest.fn();
  const setHardcore = jest.fn();
  await getGamesCompleted(mockSession, setGames as any, setHardcore as any);
  expect(setHardcore).toHaveBeenCalledWith([{ HardcoreMode: "1", PctWon: "1.0000", GameID: 5 }]);
  expect(setGames).toHaveBeenCalledWith([]);
});

test("getGamesCompleted works with numeric HardcoreMode from API", async () => {
  const games = [
    { HardcoreMode: 0, PctWon: "1.0000", GameID: 1 },
    { HardcoreMode: 1, PctWon: "1.0000", GameID: 2 },
  ];
  (fetch as jest.Mock).mockResolvedValueOnce({ json: () => Promise.resolve(games) });
  const setGames = jest.fn();
  const setHardcore = jest.fn();
  await getGamesCompleted(mockSession, setGames as any, setHardcore as any);
  expect(setGames).toHaveBeenCalledWith([{ HardcoreMode: 0, PctWon: "1.0000", GameID: 1 }]);
  expect(setHardcore).toHaveBeenCalledWith([{ HardcoreMode: 1, PctWon: "1.0000", GameID: 2 }]);
});

test("getGamesInProgress returns only in-progress softcore games", async () => {
  const games = [
    { HardcoreMode: "0", PctWon: "1.0000", GameID: 1 },
    { HardcoreMode: "0", PctWon: "0.4500", GameID: 2 },
    { HardcoreMode: "1", PctWon: "0.5000", GameID: 3 },
    { HardcoreMode: "0", PctWon: "0.0000", GameID: 4 },
  ];
  (fetch as jest.Mock).mockResolvedValueOnce({ json: () => Promise.resolve(games) });
  const setGames = jest.fn();
  await getGamesInProgress(mockSession, setGames as any);
  expect(setGames).toHaveBeenCalledWith([{ HardcoreMode: "0", PctWon: "0.4500", GameID: 2 }]);
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

test("getWantGames calls API and sets games", async () => {
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
