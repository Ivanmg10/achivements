import { getRandomGameIds, groupByDay } from "./utils";

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
  test("groups achievements by day", () => {
    const achievements = [
      { Date: "2024-01-15 10:00:00" } as any,
      { Date: "2024-01-15 12:00:00" } as any,
      { Date: "2024-01-16 10:00:00" } as any,
    ];
    const result = groupByDay(achievements);
    expect(result).toEqual([
      { date: "2024-01-15", count: 2 },
      { date: "2024-01-16", count: 1 },
    ]);
  });

  test("returns undefined for non-array input", () => {
    const result = groupByDay(null as any);
    expect(result).toBeUndefined();
  });

  test("returns empty array for empty input", () => {
    const result = groupByDay([]);
    expect(result).toEqual([]);
  });

  test("sorts by date ascending", () => {
    const achievements = [
      { Date: "2024-01-20 10:00:00" } as any,
      { Date: "2024-01-10 10:00:00" } as any,
    ];
    const result = groupByDay(achievements)!;
    expect(result[0].date).toBe("2024-01-10");
    expect(result[1].date).toBe("2024-01-20");
  });
});
