import { applyCustomOrder, calcStreak, compareSortValues, getGameSortValue, getRandomGameIds, groupByConsole, groupByDay, sumAchievementPoints } from "./utils";

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

describe("sumAchievementPoints", () => {
  test("returns zero for empty achievements", () => {
    expect(sumAchievementPoints({})).toEqual({ earned: 0, total: 0 });
  });

  test("sums all points as total, none earned when no dates set", () => {
    const achievements = {
      a: { Points: 10 } as any,
      b: { Points: 5 } as any,
    };
    expect(sumAchievementPoints(achievements)).toEqual({ earned: 0, total: 15 });
  });

  test("sums earned points from softcore or hardcore date", () => {
    const achievements = {
      a: { Points: 10, DateEarned: "2024-01-01" } as any,
      b: { Points: 5, DateEarnedHardcore: "2024-01-02" } as any,
      c: { Points: 3 } as any,
    };
    expect(sumAchievementPoints(achievements)).toEqual({ earned: 15, total: 18 });
  });

  test("hardcoreOnly ignores softcore-earned achievements", () => {
    const achievements = {
      a: { Points: 10, DateEarned: "2024-01-01" } as any,
      b: { Points: 5, DateEarnedHardcore: "2024-01-02" } as any,
    };
    expect(sumAchievementPoints(achievements, true)).toEqual({ earned: 5, total: 15 });
  });

  test("skips null/undefined entries", () => {
    const achievements = {
      a: { Points: 10, DateEarned: "2024-01-01" } as any,
      b: undefined,
    };
    expect(sumAchievementPoints(achievements)).toEqual({ earned: 10, total: 10 });
  });
});

describe("getGameSortValue", () => {
  const wantToPlay = { Title: "Jak 2", PointsTotal: 450 } as any;
  const playing = { Title: "Sly Cooper", PctWon: "0.5" } as any;

  test("returns Title for name key regardless of game shape", () => {
    expect(getGameSortValue(wantToPlay, undefined, "name")).toBe("Jak 2");
    expect(getGameSortValue(playing, undefined, "name")).toBe("Sly Cooper");
  });

  test("returns null for lastPlayed/percent on want-to-play games", () => {
    expect(getGameSortValue(wantToPlay, undefined, "lastPlayed")).toBeNull();
    expect(getGameSortValue(wantToPlay, undefined, "percent")).toBeNull();
  });

  test("returns lastPlayed from extra for playing/completed games", () => {
    expect(getGameSortValue(playing, { awards: [], lastPlayed: "2024-01-01" }, "lastPlayed")).toBe("2024-01-01");
    expect(getGameSortValue(playing, undefined, "lastPlayed")).toBeNull();
  });

  test("returns percent as a 0-100 number for playing/completed games", () => {
    expect(getGameSortValue(playing, undefined, "percent")).toBe(50);
  });

  test("returns PointsTotal for want-to-play points", () => {
    expect(getGameSortValue(wantToPlay, undefined, "points")).toBe(450);
  });

  test("returns null for points when extra has no possibleScore", () => {
    expect(getGameSortValue(playing, undefined, "points")).toBeNull();
    expect(getGameSortValue(playing, { awards: [] }, "points")).toBeNull();
  });

  test("prefers hardcore score over softcore for points when both present", () => {
    const extra = { awards: [], possibleScore: 200, scoreAchieved: 100, scoreAchievedHardcore: 150 };
    expect(getGameSortValue(playing, extra, "points")).toBe(150);
  });

  test("falls back to softcore score, then 0, for points", () => {
    expect(getGameSortValue(playing, { awards: [], possibleScore: 200, scoreAchieved: 100 }, "points")).toBe(100);
    expect(getGameSortValue(playing, { awards: [], possibleScore: 200 }, "points")).toBe(0);
  });
});

describe("applyCustomOrder", () => {
  const games = [
    { GameID: 1, Title: "Zelda" } as any,
    { GameID: 2, Title: "Alpha" } as any,
    { GameID: 3, Title: "Metroid" } as any,
  ];

  test("returns alphabetical order when there is no saved order", () => {
    expect(applyCustomOrder(games, []).map((g) => g.Title)).toEqual(["Alpha", "Metroid", "Zelda"]);
  });

  test("preserves saved order exactly when it fully covers the list", () => {
    expect(applyCustomOrder(games, [1, 3, 2]).map((g) => g.Title)).toEqual(["Zelda", "Metroid", "Alpha"]);
  });

  test("puts saved-order games first, then unordered games alphabetically", () => {
    expect(applyCustomOrder(games, [3]).map((g) => g.Title)).toEqual(["Metroid", "Alpha", "Zelda"]);
  });

  test("silently drops stale ids no longer present in the list", () => {
    expect(applyCustomOrder(games, [999, 3]).map((g) => g.Title)).toEqual(["Metroid", "Alpha", "Zelda"]);
  });
});

describe("compareSortValues", () => {
  test("treats null as always last regardless of direction", () => {
    expect(compareSortValues(null, 5, "asc")).toBe(1);
    expect(compareSortValues(5, null, "asc")).toBe(-1);
    expect(compareSortValues(null, 5, "desc")).toBe(1);
    expect(compareSortValues(null, null, "asc")).toBe(0);
  });

  test("compares numbers ascending and descending", () => {
    expect(compareSortValues(1, 2, "asc")).toBeLessThan(0);
    expect(compareSortValues(1, 2, "desc")).toBeGreaterThan(0);
  });

  test("compares strings via localeCompare", () => {
    expect(compareSortValues("a", "b", "asc")).toBeLessThan(0);
    expect(compareSortValues("b", "a", "asc")).toBeGreaterThan(0);
    expect(compareSortValues("a", "a", "asc")).toBe(0);
  });
});
