const React = require("react");

const mock = (name) => ({ children, data, ...props }) =>
  React.createElement("div", { "data-testid": name, ...props }, children);

module.exports = {
  ResponsiveContainer: mock("ResponsiveContainer"),
  LineChart: mock("LineChart"),
  Line: mock("Line"),
  CartesianGrid: mock("CartesianGrid"),
  XAxis: mock("XAxis"),
  YAxis: mock("YAxis"),
  Tooltip: mock("Tooltip"),
  PieChart: mock("PieChart"),
  Pie: ({ data = [], children, ...props }) =>
    React.createElement("div", { "data-testid": "Pie", ...props }, children),
  Cell: mock("Cell"),
  Legend: mock("Legend"),
};
