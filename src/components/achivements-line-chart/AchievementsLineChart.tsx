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
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="w-full">
      <p className="text-text-secondary text-sm px-4 pb-3">
        {total} logros en los últimos 7 días
      </p>
      {total === 0 ? (
        <div className="flex items-center justify-center h-85 text-text-secondary text-sm">
          Sin actividad esta semana
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e3e" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickFormatter={/* istanbul ignore next */ (val: string) => val.slice(5)}
            />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e1e2e",
                border: "none",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
              formatter={/* istanbul ignore next */ (value) => [`${value} logros`, ""]}
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
      )}
    </div>
  );
}
