"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: { date: string; stockIn: number; stockOut: number }[];
};

export function StockTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid var(--border)",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="stockIn"
          stroke="#0d4f3c"
          strokeWidth={2}
          dot={false}
          name="Stock In"
        />
        <Line
          type="monotone"
          dataKey="stockOut"
          stroke="#dc2626"
          strokeWidth={2}
          dot={false}
          name="Stock Out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
