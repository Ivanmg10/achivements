"use client";

import { RetroAchievementsGameCompleted } from "@/types/types";
import { groupByConsole } from "@/utils/apiCallsUtils";
import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
];

export default function ConsolesPieChart({
  games,
}: {
  games: RetroAchievementsGameCompleted[];
}) {
  const data = groupByConsole(games);

  return (
    <PieChart width={500} height={400}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={80}
        outerRadius={140}
        paddingAngle={3}
        dataKey="value"
      >
        {data.map((_, index) => (
          <Cell key={index} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          backgroundColor: "#1e1e2e",
          border: "none",
          borderRadius: "8px",
        }}
        labelStyle={{ color: "#fff" }}
      />
      <Legend layout="vertical" align="right" verticalAlign="middle" />
    </PieChart>
  );
}
