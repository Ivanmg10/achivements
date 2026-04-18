import { render, screen } from "@testing-library/react";
import AchievementsLineChart from "./AchievementsLineChart";

const mockAchievements = [
  { Date: "2024-01-15 10:00:00" } as any,
  { Date: "2024-01-15 12:00:00" } as any,
  { Date: "2024-01-16 10:00:00" } as any,
];

test("renders line chart with achievements", () => {
  render(<AchievementsLineChart achievements={mockAchievements} />);
  expect(screen.getByTestId("ResponsiveContainer")).toBeInTheDocument();
});

test("renders with empty achievements", () => {
  render(<AchievementsLineChart achievements={[]} />);
  expect(screen.getByTestId("ResponsiveContainer")).toBeInTheDocument();
});
