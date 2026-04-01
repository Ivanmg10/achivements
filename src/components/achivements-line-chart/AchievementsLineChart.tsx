// components/AchievementsLineChart.tsx
"use client";

import { RecentAchievement } from "@/types/types";
import { groupByDay } from "@/utils/utils";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AchievementsLineChart({
  achievements,
}: {
  achievements: RecentAchievement[];
}) {
  const data = groupByDay(achievements);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2e2e3e" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickFormatter={(val) => val.slice(5)} // muestra "01-15" en vez de "2024-01-15"
        />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e1e2e",
            border: "none",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#fff" }}
          formatter={(value) => [`${value} logros`, ""]}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ fill: "#6366f1", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
