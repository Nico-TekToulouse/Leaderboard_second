import { Avatar, Badge, Box, Group, Paper, Progress, Stack, Text } from "@mantine/core";
import type { FactionName } from "@/lib/theme";

type FactionRow = {
  id: string;
  name: string;
  color: FactionName;
  logo: string | null;
  totalPoints: number;
};

type LeaderboardProps = {
  factions: FactionRow[];
};

const FACTION_HEX: Record<FactionName, string> = {
  fire: "#E53935",
  water: "#1E88E5",
  earth: "#43A047",
  air: "#8E24AA",
};

const FACTION_BG: Record<FactionName, string> = {
  fire: "rgba(229,57,53,0.07)",
  water: "rgba(30,136,229,0.07)",
  earth: "rgba(67,160,71,0.07)",
  air: "rgba(142,36,170,0.07)",
};

const FACTION_MANTINE_COLOR: Record<FactionName, string> = {
  fire: "red",
  water: "blue",
  earth: "green",
  air: "violet",
};

const RANK_CONFIG: Record<number, { label: string; badgeColor: string; size: string }> = {
  0: { label: "🥇", badgeColor: "#F59E0B", size: "28px" },
  1: { label: "🥈", badgeColor: "#9CA3AF", size: "24px" },
  2: { label: "🥉", badgeColor: "#B45309", size: "24px" },
};

export default function Leaderboard({ factions }: LeaderboardProps) {
  const sorted = [...factions].sort((a, b) => b.totalPoints - a.totalPoints);
  const maxPoints = sorted[0]?.totalPoints ?? 1;

  return (
    <Stack gap="sm">
      {sorted.map((faction, index) => {
        const pct = maxPoints > 0 ? (faction.totalPoints / maxPoints) * 100 : 0;
        const rankCfg = RANK_CONFIG[index];
        const hex = FACTION_HEX[faction.color];
        const mantineColor = FACTION_MANTINE_COLOR[faction.color];
        const isFirst = index === 0;

        return (
          <Paper
            key={faction.id}
            p="md"
            radius="md"
            withBorder
            style={{
              borderLeft: `5px solid ${hex}`,
              background: isFirst ? FACTION_BG[faction.color] : undefined,
              transition: "box-shadow 150ms ease",
            }}
          >
            <Group gap="md" wrap="nowrap">
              {/* Rang */}
              <Box w={40} style={{ textAlign: "center", flexShrink: 0 }}>
                {rankCfg ? (
                  <Text style={{ fontSize: rankCfg.size, lineHeight: 1 }}>{rankCfg.label}</Text>
                ) : (
                  <Badge variant="light" color="gray" size="lg" circle>
                    {index + 1}
                  </Badge>
                )}
              </Box>

              {/* Avatar + Nom */}
              <Group gap="sm" style={{ flexShrink: 0, width: 160 }}>
                <Avatar
                  src={faction.logo}
                  size={isFirst ? "md" : "sm"}
                  radius="xl"
                  style={faction.logo ? undefined : { backgroundColor: hex }}
                >
                  {!faction.logo && (
                    <Text fw={800} fz={isFirst ? "md" : "sm"} c="white">
                      {faction.name[0].toUpperCase()}
                    </Text>
                  )}
                </Avatar>
                <Text fw={isFirst ? 800 : 600} fz={isFirst ? "md" : "sm"}>
                  {faction.name}
                </Text>
              </Group>

              {/* Barre de progression */}
              <Box style={{ flex: 1, minWidth: 80 }}>
                <Progress
                  value={pct}
                  color={mantineColor}
                  size={isFirst ? "xl" : "lg"}
                  radius="xl"
                  striped={isFirst}
                  animated={isFirst}
                />
              </Box>

              {/* Score */}
              <Box w={100} style={{ textAlign: "right", flexShrink: 0 }}>
                <Text fw={800} fz={isFirst ? "lg" : "md"} c={`${mantineColor}.6`}>
                  {faction.totalPoints.toLocaleString("fr-FR")}
                </Text>
                <Text fz="xs" c="dimmed">pts</Text>
              </Box>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}
