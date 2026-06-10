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
import { Center, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconChartLine } from "@tabler/icons-react";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import type { FactionMetaMap, FactionSeries } from "@/components/charts/factionSeries";
import type { DayChartPoint } from "@/lib/factions";

type DayLineChartProps = {
  data: DayChartPoint[];
  meta: FactionMetaMap;
  factionSeries: FactionSeries[];
};

type LegendFormatterResult = React.ReactNode;

export default function DayLineChart({ data, meta, factionSeries }: DayLineChartProps) {
  if (data.length === 0) {
    return (
      <Center py={60}>
        <Stack align="center" gap="xs">
          <ThemeIcon size={48} radius="xl" variant="light" color="gray">
            <IconChartLine size={24} />
          </ThemeIcon>
          <Text c="dimmed" fz="sm" ta="center">
            Aucune donnée disponible pour le moment.
          </Text>
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
    <ResponsiveContainer width="100%" height={360}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 16, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-default-border)" vertical={false} />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--mantine-color-dimmed)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--mantine-color-dimmed)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v.toLocaleString("fr-FR")}`}
          width={55}
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
        />

        <Legend
          wrapperStyle={{ paddingTop: 16, fontSize: 13 }}
          formatter={legendFormatter}
        />

        {factionSeries.map((f) => (
          <Line
            key={f.key}
            type="monotone"
            dataKey={f.key}
            stroke={f.color}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0, fill: f.color }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: f.color, fill: "var(--mantine-color-body)" }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
