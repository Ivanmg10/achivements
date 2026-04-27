import { calcStreak, getRandomGameIds, groupByConsole, groupByDay } from "./utils";

describe("getRandomGameIds", () => {
  test("returns correct count", () => {
    const ids = getRandomGameIds(3);
    expect(ids.length).toBe(3);
  });

  test("returns 5 by default", () => {
    const ids = getRandomGameIds();
    expect(ids.length).toBe(5);
  });

  test("returns strings", () => {
    const ids = getRandomGameIds(1);
    expect(typeof ids[0]).toBe("string");
  });
});

describe("groupByDay", () => {
  test("always returns 7 entries", () => {
    const result = groupByDay([]);
    expect(result.length).toBe(7);
  });

  test("counts achievements that fall within last 7 days", () => {
    const today = new Date().toISOString().split("T")[0];
    const achievements = [
      { Date: `${today} 10:00:00` } as any,
      { Date: `${today} 12:00:00` } as any,
    ];
    const result = groupByDay(achievements);
    const todayEntry = result.find((r) => r.date === today);
    expect(todayEntry?.count).toBe(2);
  });

  test("returns zero counts for non-array input", () => {
    const result = groupByDay(null as any);
    expect(result.length).toBe(7);
    result.forEach((r) => expect(r.count).toBe(0));
  });

  test("returns zero counts for empty input", () => {
    const result = groupByDay([]);
    result.forEach((r) => expect(r.count).toBe(0));
  });

  test("dates are in ascending order", () => {
    const result = groupByDay([]);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].date >= result[i - 1].date).toBe(true);
    }
  });
});

describe("groupByConsole", () => {
  test("groups games by console", () => {
    const games = [
      { ConsoleName: "PS2", GameID: 1 },
      { ConsoleName: "PS2", GameID: 2 },
      { ConsoleName: "GBA", GameID: 3 },
    ] as any;
    const result = groupByConsole(games);
    expect(result).toContainEqual({ name: "PS2", value: 2 });
    expect(result).toContainEqual({ name: "GBA", value: 1 });
  });

  test("excludes Events console", () => {
    const games = [
      { ConsoleName: "Events", GameID: 1 },
      { ConsoleName: "PS2", GameID: 2 },
    ] as any;
    const result = groupByConsole(games);
    expect(result).not.toContainEqual(expect.objectContaining({ name: "Events" }));
    expect(result).toContainEqual({ name: "PS2", value: 1 });
  });
});

describe("calcStreak", () => {
  test("returns 0 for empty array", () => {
    expect(calcStreak([])).toBe(0);
  });

  test("counts consecutive days ending today", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const achievements = [
      { Date: today.toISOString().split("T")[0] + " 10:00:00" } as any,
      { Date: yesterday.toISOString().split("T")[0] + " 10:00:00" } as any,
    ];
    expect(calcStreak(achievements)).toBe(2);
  });

  test("stops at gap", () => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const achievements = [
      { Date: twoDaysAgo.toISOString().split("T")[0] + " 10:00:00" } as any,
    ];
    expect(calcStreak(achievements)).toBe(0);
  });
});
