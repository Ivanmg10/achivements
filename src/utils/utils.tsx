import { ragamesIds } from "@/constants/ragamesidpool";
import { RecentAchievement } from "@/types/types";

export function getRandomGameIds(count: number = 5): string[] {
  const shuffled = [...ragamesIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const groupByDay = (achievements: RecentAchievement[]) => {
  if (!Array.isArray(achievements)) return;

  const grouped = achievements.reduce(
    (acc, a) => {
      const day = a.Date.split(" ")[0]; // "2024-01-15"
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
};
