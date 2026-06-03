"use client";

import { Box, Group, Paper, Tabs, Text, ThemeIcon, Title } from "@mantine/core";
import { IconChartBar, IconChartLine, IconTable } from "@tabler/icons-react";
import ActivityBarChart from "@/components/charts/ActivityBarChart";
import DayLineChart from "@/components/charts/DayLineChart";
import Leaderboard from "@/components/Leaderboard";
import type { FactionMetaMap } from "@/components/charts/factionSeries";
import type { ActivityChartPoint, DayChartPoint, FactionRow } from "@/lib/factions";

type LeaderboardTabsProps = {
  factions: FactionRow[];
  byActivity: ActivityChartPoint[];
  byDay: DayChartPoint[];
};

type TabHeaderProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
};

function TabHeader({ icon, title, description, color }: TabHeaderProps) {
  return (
    <Group gap="sm" mb="lg">
      <ThemeIcon size="lg" radius="md" variant="light" color={color}>
        {icon}
      </ThemeIcon>
      <Box>
        <Title order={4} lh={1.2}>{title}</Title>
        <Text fz="xs" c="dimmed">{description}</Text>
      </Box>
    </Group>
  );
}

/** Construit la FactionMetaMap (label + logo) à partir des FactionRow BDD. */
function buildFactionMetaMap(factions: FactionRow[]): FactionMetaMap {
  const fallback = { label: "—", logo: null };
  return {
    fire:  factions.find((f) => f.color === "fire")  ? { label: factions.find((f) => f.color === "fire")!.name,  logo: factions.find((f) => f.color === "fire")!.logo  } : fallback,
    water: factions.find((f) => f.color === "water") ? { label: factions.find((f) => f.color === "water")!.name, logo: factions.find((f) => f.color === "water")!.logo } : fallback,
    earth: factions.find((f) => f.color === "earth") ? { label: factions.find((f) => f.color === "earth")!.name, logo: factions.find((f) => f.color === "earth")!.logo } : fallback,
    air:   factions.find((f) => f.color === "air")   ? { label: factions.find((f) => f.color === "air")!.name,   logo: factions.find((f) => f.color === "air")!.logo   } : fallback,
  };
}

export default function LeaderboardTabs({ factions, byActivity, byDay }: LeaderboardTabsProps) {
  const meta = buildFactionMetaMap(factions);

  return (
    <Paper shadow="sm" p="lg" radius="lg" withBorder>
      <Tabs defaultValue="table" variant="pills">
        <Tabs.List mb="xl" style={{ gap: 8 }}>
          <Tabs.Tab value="table" leftSection={<IconTable size={15} />} fw={600}>
            Classement
          </Tabs.Tab>
          <Tabs.Tab value="activity" leftSection={<IconChartBar size={15} />} fw={600}>
            Par activité
          </Tabs.Tab>
          <Tabs.Tab value="day" leftSection={<IconChartLine size={15} />} fw={600}>
            Par jour
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="table">
          <TabHeader
            icon={<IconTable size={16} />}
            title="Classement des factions"
            description="Scores totaux cumulés sur toutes les activités"
            color="blue"
          />
          <Leaderboard factions={factions} />
        </Tabs.Panel>

        <Tabs.Panel value="activity">
          <TabHeader
            icon={<IconChartBar size={16} />}
            title="Points par activité"
            description="Comparaison des 4 factions sur chaque activité"
            color="orange"
          />
          <ActivityBarChart data={byActivity} meta={meta} />
        </Tabs.Panel>

        <Tabs.Panel value="day">
          <TabHeader
            icon={<IconChartLine size={16} />}
            title="Évolution cumulative"
            description="Progression des points au fil des jours"
            color="teal"
          />
          <DayLineChart data={byDay} meta={meta} />
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}
