import { ragamesIds } from "@/constants/ragamesidpool";
import { RecentAchievement } from "@/types/types";

export function getRandomGameIds(count: number = 5): string[] {
  const shuffled = [...ragamesIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const groupByDay = (achievements: RecentAchievement[]) => {
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split("T")[0]);
  }

  if (!Array.isArray(achievements)) return last7Days.map((date) => ({ date, count: 0 }));

  const grouped = achievements.reduce(
    (acc, a) => {
      const day = a.Date.split(" ")[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return last7Days.map((date) => ({ date, count: grouped[date] || 0 }));
};
