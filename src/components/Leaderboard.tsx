import { Avatar, Badge, Box, Group, Paper, Progress, Stack, Text } from "@mantine/core";

type FactionRow = {
  id: string;
  name: string;
  hexColor: string;
  logo: string | null;
  totalPoints: number;
};

type LeaderboardProps = {
  factions: FactionRow[];
};

function hexToBackground(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.07)`;
}

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
        const hex = faction.hexColor;
        const isFirst = index === 0;

        return (
          <Paper
            key={faction.id}
            p="md"
            radius="md"
            withBorder
            style={{
              borderLeft: `5px solid ${hex}`,
              background: isFirst ? hexToBackground(hex) : undefined,
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
                  color={hex}
                  size={isFirst ? "xl" : "lg"}
                  radius="xl"
                  striped={isFirst}
                  animated={isFirst}
                />
              </Box>

              {/* Score */}
              <Box w={100} style={{ textAlign: "right", flexShrink: 0 }}>
                <Text fw={800} fz={isFirst ? "lg" : "md"} style={{ color: hex }}>
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
