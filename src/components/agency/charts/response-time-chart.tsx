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

interface ResponseTimeDataPoint {
  bucket: string;
  count: number;
  percentage: number;
}

interface Props {
  data: ResponseTimeDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; payload: ResponseTimeDataPoint }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0].payload;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-semibold">{label}</p>
      <p>Count: {item.count}</p>
      <p>Percentage: {item.percentage}%</p>
    </div>
  );
}

export function ResponseTimeChart({ data }: Props) {
  return (
    <Card className="qs-pop">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Response Time Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="bucket"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill="oklch(0.547 0.215 262.881)"
                radius={[0, 4, 4, 0]}
                name="Count"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
