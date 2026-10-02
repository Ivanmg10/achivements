import { calcAvgPerDay, calcStreak, calcThisMonth, compareSortValues, getBestMonth, getGameSortValue, getRandomGameIds, groupByConsole, groupByDay, pinnedKey, sumAchievementPoints, achievementBadgeUrl, achievementGameIconUrl, completionBuckets, dominantColors, groupByDaySource, heatLevel } from "./utils";

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
      { Date: `${today} 10:00:00` } as never,
      { Date: `${today} 12:00:00` } as never,
    ];
    const result = groupByDay(achievements);
    const todayEntry = result.find((r) => r.date === today);
    expect(todayEntry?.count).toBe(2);
  });

  test("returns zero counts for non-array input", () => {
    const result = groupByDay(null as never);
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
    ] as never;
    const result = groupByConsole(games);
    expect(result).toContainEqual({ name: "PS2", value: 2 });
    expect(result).toContainEqual({ name: "GBA", value: 1 });
  });

  test("excludes Events console", () => {
    const games = [
      { ConsoleName: "Events", GameID: 1 },
      { ConsoleName: "PS2", GameID: 2 },
    ] as never;
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
      { Date: today.toISOString().split("T")[0] + " 10:00:00" } as never,
      { Date: yesterday.toISOString().split("T")[0] + " 10:00:00" } as never,
    ];
    expect(calcStreak(achievements)).toBe(2);
  });

  test("stops at gap", () => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const achievements = [
      { Date: twoDaysAgo.toISOString().split("T")[0] + " 10:00:00" } as never,
    ];
    expect(calcStreak(achievements)).toBe(0);
  });
});

describe("getBestMonth", () => {
  test("returns null for empty array", () => {
    expect(getBestMonth([])).toBeNull();
  });

  test("picks the month with the highest total points", () => {
    const achievements = [
      { Date: "2024-01-05 10:00:00", Points: 10 } as never,
      { Date: "2024-01-15 10:00:00", Points: 10 } as never,
      { Date: "2024-02-10 10:00:00", Points: 5 } as never,
    ];
    const result = getBestMonth(achievements);
    expect(result?.[0]).toBe("2024-01");
    expect(result?.[1]).toEqual({ pts: 20, ach: 2 });
  });

  test("picks the month with the most unlocks when ranking by count (Steam has no points)", () => {
    const achievements = [
      { Date: "2024-01-05 10:00:00", Points: 50 } as never,
      { Date: "2024-02-10 10:00:00", Points: 0 } as never,
      { Date: "2024-02-11 10:00:00", Points: 0 } as never,
    ];
    expect(getBestMonth(achievements, "ach")?.[0]).toBe("2024-02");
    expect(getBestMonth(achievements)?.[0]).toBe("2024-01");
  });
});

describe("calcThisMonth", () => {
  test("returns zero totals when there is no data", () => {
    expect(calcThisMonth([])).toEqual({ pts: 0, ach: 0 });
  });

  test("sums only achievements from the current calendar month", () => {
    const monthKey = new Date().toISOString().slice(0, 7);
    const achievements = [
      { Date: `${monthKey}-05 10:00:00`, Points: 10 } as never,
      { Date: `${monthKey}-15 10:00:00`, Points: 5 } as never,
      { Date: "2000-01-01 10:00:00", Points: 100 } as never,
    ];
    expect(calcThisMonth(achievements)).toEqual({ pts: 15, ach: 2 });
  });
});

describe("calcAvgPerDay", () => {
  test("returns 0 for empty array", () => {
    expect(calcAvgPerDay([])).toBe(0);
  });

  test("counts only achievements within the given day window", () => {
    const now = new Date();
    const recent = new Date(now); recent.setDate(now.getDate() - 5);
    const old = new Date(now); old.setDate(now.getDate() - 40);
    const achievements = [
      { Date: `${recent.toISOString().split("T")[0]} 10:00:00`, Points: 5 } as never,
      { Date: `${old.toISOString().split("T")[0]} 10:00:00`, Points: 5 } as never,
    ];
    expect(calcAvgPerDay(achievements, 30)).toBeCloseTo(1 / 30);
  });
});

describe("sumAchievementPoints", () => {
  test("returns zero for empty achievements", () => {
    expect(sumAchievementPoints({})).toEqual({ earned: 0, total: 0 });
  });

  test("sums all points as total, none earned when no dates set", () => {
    const achievements = {
      a: { Points: 10 } as never,
      b: { Points: 5 } as never,
    };
    expect(sumAchievementPoints(achievements)).toEqual({ earned: 0, total: 15 });
  });

  test("sums earned points from softcore or hardcore date", () => {
    const achievements = {
      a: { Points: 10, DateEarned: "2024-01-01" } as never,
      b: { Points: 5, DateEarnedHardcore: "2024-01-02" } as never,
      c: { Points: 3 } as never,
    };
    expect(sumAchievementPoints(achievements)).toEqual({ earned: 15, total: 18 });
  });

  test("hardcoreOnly ignores softcore-earned achievements", () => {
    const achievements = {
      a: { Points: 10, DateEarned: "2024-01-01" } as never,
      b: { Points: 5, DateEarnedHardcore: "2024-01-02" } as never,
    };
    expect(sumAchievementPoints(achievements, true)).toEqual({ earned: 5, total: 15 });
  });

  test("skips null/undefined entries", () => {
    const achievements = {
      a: { Points: 10, DateEarned: "2024-01-01" } as never,
      b: undefined,
    };
    expect(sumAchievementPoints(achievements)).toEqual({ earned: 10, total: 10 });
  });
});

describe("getGameSortValue", () => {
  const wantToPlay = { Title: "Jak 2", PointsTotal: 450 } as never;
  const playing = { Title: "Sly Cooper", PctWon: "0.5" } as never;

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

describe('pinnedKey', () => {
  test('keys RA pins by achievement id and Steam pins by game + apiname', () => {
    expect(pinnedKey({ source: 'ra', achievement_id: 5 } as never)).toBe('ra:5')
    expect(pinnedKey({ source: 'steam', game_id: 620, steam_apiname: 'WIN' } as never)).toBe('steam:620:WIN')
  })
})

describe('achievement image URLs', () => {
  const base = { BadgeName: '123', GameIcon: '/Images/1.png' } as never

  test('build RA URLs from RA paths', () => {
    expect(achievementBadgeUrl(base)).toBe('https://media.retroachievements.org/Badge/123.png')
    expect(achievementGameIconUrl(base)).toBe('https://retroachievements.org/Images/1.png')
  })

  test('use the full URLs a Steam unlock carries', () => {
    const steam = { BadgeName: '', BadgeUrl: 'https://cdn/b.jpg', GameIconUrl: 'https://cdn/h.jpg' } as never
    expect(achievementBadgeUrl(steam)).toBe('https://cdn/b.jpg')
    expect(achievementGameIconUrl(steam)).toBe('https://cdn/h.jpg')
  })

  test('are undefined without any image', () => {
    expect(achievementBadgeUrl({ BadgeName: '' } as never)).toBeUndefined()
    expect(achievementGameIconUrl({} as never)).toBeUndefined()
  })
})

describe("completionBuckets", () => {
  test("counts games per completion band, with 100% on its own", () => {
    expect(completionBuckets([0, 0.1, 0.24, 0.25, 0.6, 0.75, 0.99, 1])).toEqual([3, 1, 1, 2, 1]);
  });

  test("is all zeros without games, and puts over-100% with the perfect ones", () => {
    expect(completionBuckets([])).toEqual([0, 0, 0, 0, 0]);
    expect(completionBuckets([1.2])).toEqual([0, 0, 0, 0, 1]);
  });
});

describe('dominantColors', () => {
  /** RGBA pixels: `count` of the given colour. */
  const px = (count: number, r: number, g: number, b: number, a = 255) => Array.from({ length: count }, () => [r, g, b, a]).flat()

  test('the two colours that stand out, most first', () => {
    const pixels = new Uint8ClampedArray([...px(60, 30, 160, 60), ...px(30, 20, 60, 200)])
    expect(dominantColors(pixels)).toEqual([[30, 160, 60], [20, 60, 200]])
  })

  test('a big grey background does not beat a smaller saturated colour', () => {
    const pixels = new Uint8ClampedArray([...px(70, 20, 20, 20), ...px(30, 220, 40, 40)])
    expect(dominantColors(pixels)[0]).toEqual([220, 40, 40])
  })

  test('the second colour is clearly different from the first, not a near shade', () => {
    const pixels = new Uint8ClampedArray([...px(50, 200, 40, 40), ...px(40, 210, 50, 50), ...px(10, 40, 40, 200)])
    expect(dominantColors(pixels)[1]).toEqual([40, 40, 200])
  })

  test('one colour comes back twice; transparent pixels are ignored; nothing gives nothing', () => {
    expect(dominantColors(new Uint8ClampedArray([...px(10, 10, 200, 10), ...px(90, 255, 0, 0, 0)]))).toEqual([[10, 200, 10], [10, 200, 10]])
    expect(dominantColors(new Uint8ClampedArray())).toEqual([])
  })
})

describe('groupByDaySource', () => {
  const day = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() - offset)
    return d.toISOString().split('T')[0]
  }
  const ach = (offset: number, source?: 'steam') => ({ Date: `${day(offset)} 12:00:00`, Source: source }) as never

  test('one row per day, oldest first, ending today, split by platform', () => {
    const rows = groupByDaySource([ach(0), ach(0, 'steam'), ach(2), ach(30)], 7)
    expect(rows).toHaveLength(7)
    expect(rows[6]).toEqual({ date: day(0), ra: 1, steam: 1, total: 2 })
    expect(rows[4]).toEqual({ date: day(2), ra: 1, steam: 0, total: 1 })
    expect(rows.reduce((s, r) => s + r.total, 0)).toBe(3)
  })

  test('copes with no data', () => {
    expect(groupByDaySource(undefined as never, 3).map((r) => r.total)).toEqual([0, 0, 0])
  })
})

describe('heatLevel', () => {
  test('nothing is level 0, the busiest day is the top level', () => {
    expect(heatLevel(0, 165)).toBe(0)
    expect(heatLevel(165, 165)).toBe(4)
  })

  test('small days stay visible next to a huge one, and the steps spread out', () => {
    expect(heatLevel(1, 165)).toBe(1)
    expect([5, 20, 50, 100].map((n) => heatLevel(n, 165))).toEqual([1, 2, 3, 4])
  })

  test('no data at all is level 0', () => {
    expect(heatLevel(3, 0)).toBe(0)
  })
})
