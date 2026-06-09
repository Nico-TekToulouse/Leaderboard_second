import {
  Title,
  Text,
  Stack,
  Group,
  ThemeIcon,
  SimpleGrid,
  Paper,
  Avatar,
  Badge,
  ScrollArea,
} from "@mantine/core";
import { IconUsers, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import ErrorAlert from "@/components/ErrorAlert";
import { fetchAllFactionsWithMembers } from "@/lib/members";
import { fetchFactionLeaderboard } from "@/lib/factions";


export default async function FactionListPage() {
  const [factionsWithMembers, leaderboard] = await Promise.all([
    fetchAllFactionsWithMembers(),
    fetchFactionLeaderboard(),
  ]);

  const rankByFaction = Object.fromEntries(
    leaderboard.map((f, i) => [f.id, i + 1])
  );

  const RANK_LABELS: Record<number, string> = {
    1: "🥇 1er",
    2: "🥈 2ème",
    3: "🥉 3ème",
    4: "4ème",
  };

  if (factionsWithMembers.length === 0) {
    return (
      <Stack gap="xl">
        <Group gap="sm">
          <ThemeIcon size="xl" radius="md" color="blue">
            <IconUsers size={22} />
          </ThemeIcon>
          <Stack gap={0}>
            <Title order={2}>Factions</Title>
            <Text c="dimmed" fz="sm">
              Membres répartis par faction
            </Text>
          </Stack>
        </Group>
        <ErrorAlert
          title="Données indisponibles"
          message="Impossible de charger les factions depuis la base de données."
        />
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      <Group gap="sm">
        <ThemeIcon size="xl" radius="md" color="blue">
          <IconUsers size={22} />
        </ThemeIcon>
        <Stack gap={0}>
          <Title order={2}>Factions</Title>
          <Text c="dimmed" fz="sm">
            {factionsWithMembers.reduce((sum, f) => sum + f.members.length, 0)} membres répartis en {factionsWithMembers.length} factions
          </Text>
        </Stack>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {factionsWithMembers.map((faction) => {
          const rank = rankByFaction[faction.id];
          const leaderboardFaction = leaderboard.find((f) => f.id === faction.id);
          const totalPoints = leaderboardFaction?.totalPoints ?? 0;

          return (
            <Link
              key={faction.id}
              href={`/faction/${faction.id}`}
              style={{ textDecoration: "none" }}
            >
            <Paper
              shadow="xs"
              radius="md"
              withBorder
              p="md"
              style={{ display: "block" }}
            >
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <Avatar
                    size="md"
                    radius="xl"
                    style={{ backgroundColor: faction.color }}
                    color={faction.color}
                  >
                    {faction.name[0].toUpperCase()}
                  </Avatar>
                  <Stack gap={2}>
                    <Text fw={700} fz="md" c="dark">
                      {faction.name}
                    </Text>
                    <Text fz="xs" c="dimmed">
                      {totalPoints.toLocaleString("fr-FR")} pts
                    </Text>
                  </Stack>
                </Group>
                <Stack gap={4} align="flex-end">
                  <Badge color={faction.color} variant="light">
                    {RANK_LABELS[rank] ?? `${rank}ème`}
                  </Badge>
                  <Text fz="xs" c="dimmed">
                    {faction.members.length} membre{faction.members.length !== 1 ? "s" : ""}
                  </Text>
                </Stack>
              </Group>

              <ScrollArea h={200} offsetScrollbars>
                <Stack gap={6}>
                  {faction.members.length === 0 ? (
                    <Text fz="sm" c="dimmed" ta="center" py="md">
                      Aucun membre assigné
                    </Text>
                  ) : (
                    faction.members.map((member) => (
                      <Group key={member.id} gap="sm" px={4} py={4}
                        style={{ borderRadius: 6, background: "var(--mantine-color-gray-0)" }}
                      >
                        <ThemeIcon size="sm" radius="xl" color={faction.color} variant="light">
                          <IconUser size={12} />
                        </ThemeIcon>
                        <Text fz="sm" fw={500}>
                          {member.firstName} {member.lastName}
                        </Text>
                      </Group>
                    ))
                  )}
                </Stack>
              </ScrollArea>
            </Paper>
            </Link>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}

