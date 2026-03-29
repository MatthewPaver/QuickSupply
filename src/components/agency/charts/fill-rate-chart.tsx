"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface FillRateDataPoint {
  date: string;
  total: number;
  filled: number;
  rate: number;
}

interface Props {
  data: FillRateDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const filled = payload.find((p) => p.dataKey === "filled")?.value ?? 0;
  const unfilled = payload.find((p) => p.dataKey === "unfilled")?.value ?? 0;
  const total = filled + unfilled;
  const rate = total > 0 ? Math.round((filled / total) * 100) : 0;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-semibold">{label}</p>
      <p>
        Filled: <span className="text-emerald-600">{filled}</span>
      </p>
      <p>Total: {total}</p>
      <p>
        Rate: <span className="font-semibold">{rate}%</span>
      </p>
    </div>
  );
}

export function FillRateChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: d.date,
    filled: d.filled,
    unfilled: d.total - d.filled,
  }));

  return (
    <Card className="qs-pop">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Daily Fill Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="filled"
                stackId="stack"
                fill="#059669"
                radius={[0, 0, 0, 0]}
                name="Filled"
              />
              <Bar
                dataKey="unfilled"
                stackId="stack"
                fill="oklch(0.556 0.016 285.938)"
                radius={[2, 2, 0, 0]}
                name="Unfilled"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
