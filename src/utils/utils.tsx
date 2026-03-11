import { ragamesIds } from "@/mocks/ragamesidpool";

export function getRandomGameIds(count: number = 5): string[] {
  const shuffled = [...ragamesIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
