"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type Point = { label: string; value: number };

const axisProps = {
  stroke: "var(--color-text-muted)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({ unit }: { unit?: string }) {
  return (
    <Tooltip
      cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
      contentStyle={{
        background: "var(--color-surface-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        fontSize: 12,
        color: "var(--color-text)",
        boxShadow: "0 4px 16px rgb(0 0 0 / 0.08)",
      }}
      labelStyle={{ color: "var(--color-text-muted)" }}
      formatter={(v) => [`${v as number}${unit ? ` ${unit}` : ""}`, ""]}
    />
  );
}

export function LineTrend({
  data,
  color = "var(--color-brand-500)",
  unit,
  height = 220,
}: {
  data: Point[];
  color?: string;
  unit?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={40} domain={["auto", "auto"]} />
        <ChartTooltip unit={unit} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaTrend({
  data,
  color = "var(--color-brand-500)",
  unit,
  height = 220,
}: {
  data: Point[];
  color?: string;
  unit?: string;
  height?: number;
}) {
  const id = `grad-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={40} domain={["auto", "auto"]} />
        <ChartTooltip unit={unit} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${id})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarTrend({
  data,
  color = "var(--color-brand-500)",
  unit,
  height = 220,
  goal,
}: {
  data: Point[];
  color?: string;
  unit?: string;
  height?: number;
  goal?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={40} />
        <ChartTooltip unit={unit} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={goal && d.value >= goal ? "var(--color-mint-500)" : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Tiny inline sparkline for cards. */
export function MiniSpark({ data, color = "var(--color-brand-500)" }: { data: Point[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
