"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface UtilizationDataPoint {
  name: string;
  utilization: number;
}

interface Props {
  data: UtilizationDataPoint[];
}

function getBarColor(utilization: number): string {
  if (utilization >= 75) return "#059669";
  if (utilization >= 40) return "#d97706";
  return "oklch(0.577 0.245 27.325)";
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: UtilizationDataPoint }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-semibold">{label}</p>
      <p>Utilization: {payload[0].value}%</p>
    </div>
  );
}

export function UtilizationChart({ data }: Props) {
  const top10 = data.slice(0, 10);

  return (
    <Card className="qs-pop">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Top 10 Teachers by Utilization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top10}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                interval={0}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="utilization" radius={[4, 4, 0, 0]} name="Utilization">
                {top10.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.utilization)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
