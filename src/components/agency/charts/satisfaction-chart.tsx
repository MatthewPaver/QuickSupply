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

interface SatisfactionDataPoint {
  name: string;
  avgRating: number;
  reviewCount: number;
}

interface Props {
  data: SatisfactionDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: SatisfactionDataPoint }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0].payload;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-semibold">{label}</p>
      <p>Avg Rating: {item.avgRating} / 5</p>
      <p>Reviews: {item.reviewCount}</p>
    </div>
  );
}

export function SatisfactionChart({ data }: Props) {
  const top10 = data.slice(0, 10);

  return (
    <Card className="qs-pop">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Top 10 Schools by Rating
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
                domain={[0, 5]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="avgRating"
                fill="#059669"
                radius={[4, 4, 0, 0]}
                name="Avg Rating"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
