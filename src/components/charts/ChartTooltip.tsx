"use client";

import { Avatar, Box, Group, Paper, Text } from "@mantine/core";
import type { TooltipPayloadEntry } from "recharts";
import type { FactionMetaMap, FactionSeriesKey } from "@/components/charts/factionSeries";
import { FACTION_SERIES } from "@/components/charts/factionSeries";

type ChartTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<TooltipPayloadEntry>;
  label?: string;
  meta: FactionMetaMap;
};

/**
 * Tooltip partagé entre ActivityBarChart et DayLineChart.
 * Affiche les 4 factions triées par points décroissants avec leur rang,
 * leur logo (si disponible) ou une pastille de couleur, leur nom BDD et leurs points.
 */
export function ChartTooltip({ active, payload, label, meta }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const sorted = [...payload]
    .filter((entry) => typeof entry.value === "number" && entry.value > 0)
    .sort((a, b) => {
      const aVal = typeof a.value === "number" ? a.value : 0;
      const bVal = typeof b.value === "number" ? b.value : 0;
      return bVal - aVal;
    });

  if (sorted.length === 0) return null;

  return (
    <Paper shadow="md" p="sm" radius="md" withBorder style={{ minWidth: 200 }}>
      {label ? (
        <Text fw={700} fz="sm" mb={8} lineClamp={2}>
          {label}
        </Text>
      ) : null}
      <Box style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((entry, index) => {
          const key = typeof entry.dataKey === "string" ? (entry.dataKey as FactionSeriesKey) : null;
          if (!key) return null;

          const factionMeta = meta[key];
          const seriesColor =
            FACTION_SERIES.find((s) => s.key === key)?.color ?? (typeof entry.color === "string" ? entry.color : "#888");
          const entryLabel = factionMeta?.label ?? key;
          const logo = factionMeta?.logo ?? null;
          const isFirst = index === 0;
          const points = typeof entry.value === "number" ? entry.value : 0;

          return (
            <Group key={key} gap={8} wrap="nowrap" align="center">
              <Text fz="xs" c="dimmed" w={14} ta="right" style={{ flexShrink: 0 }}>
                {index + 1}.
              </Text>
              {logo ? (
                <Avatar
                  src={logo}
                  size={18}
                  radius="xl"
                  style={{ flexShrink: 0 }}
                />
              ) : (
                <Box
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: seriesColor,
                    flexShrink: 0,
                  }}
                />
              )}
              <Text
                fz="xs"
                fw={isFirst ? 700 : 400}
                style={{ color: seriesColor, flex: 1 }}
              >
                {entryLabel}
              </Text>
              <Text fz="xs" fw={isFirst ? 700 : 400} c="dark" style={{ flexShrink: 0 }}>
                {points.toLocaleString("fr-FR")} pts
              </Text>
            </Group>
          );
        })}
      </Box>
    </Paper>
  );
}
