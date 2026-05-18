// PieChart component for Controlled GenUI demo
// (Implementation will be added after planning)

"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const PALETTE = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];

export type PieDatum = { name: string; value: number };

export function GenPieChart({
  title,
  data,
}: {
  title?: string;
  data: PieDatum[];
}) {
  console.log("[GenPieChart] title", title, "data", data);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {title && <h4 className="font-semibold text-slate-900 mb-2">{title}</h4>}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default GenPieChart;
