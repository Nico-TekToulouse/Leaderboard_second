"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Center, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconChartBar } from "@tabler/icons-react";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import type { FactionMetaMap, FactionSeries } from "@/components/charts/factionSeries";
import type { ActivityChartPoint } from "@/lib/factions";

type ActivityBarChartProps = {
  data: ActivityChartPoint[];
  meta: FactionMetaMap;
  factionSeries: FactionSeries[];
};

type LegendFormatterResult = React.ReactNode;

export default function ActivityBarChart({ data, meta, factionSeries }: ActivityBarChartProps) {
  if (data.length === 0) {
    return (
      <Center py={60}>
        <Stack align="center" gap="xs">
          <ThemeIcon size={48} radius="xl" variant="light" color="gray">
            <IconChartBar size={24} />
          </ThemeIcon>
          <Text c="dimmed" fz="sm">Aucune Epitech Race enregistrée pour le moment.</Text>
        </Stack>
      </Center>
    );
  }

  function legendFormatter(value: string): LegendFormatterResult {
    const key = value as keyof FactionMetaMap;
    const factionMeta = meta[key];
    const label = factionMeta?.label ?? value;
    return label;
  }

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 16, left: 0, bottom: 60 }}
        barCategoryGap="25%"
        barGap={3}
      >
        <defs>
          {factionSeries.map((f) => (
            <linearGradient key={f.key} id={`grad-${f.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={f.color} stopOpacity={1} />
              <stop offset="100%" stopColor={f.color} stopOpacity={0.6} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-2)" vertical={false} />

        <XAxis
          dataKey="activity"
          tick={{ fontSize: 11, fill: "var(--mantine-color-dimmed)" }}
          tickLine={false}
          axisLine={false}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--mantine-color-dimmed)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}`}
          width={45}
        />

        <Tooltip
          content={(props) => (
            <ChartTooltip
              active={props.active}
              payload={props.payload}
              label={typeof props.label === "string" ? props.label : undefined}
              meta={meta}
              factionSeries={factionSeries}
            />
          )}
          cursor={{ fill: "var(--mantine-color-gray-1)" }}
        />

        <Legend
          wrapperStyle={{ paddingTop: 20, fontSize: 13 }}
          formatter={legendFormatter}
        />

        {factionSeries.map((f) => (
          <Bar key={f.key} dataKey={f.key} fill={`url(#grad-${f.key})`} radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#grad-${f.key})`} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
