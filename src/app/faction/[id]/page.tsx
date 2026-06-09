import {
  Title,
  Text,
  Stack,
  Group,
  ThemeIcon,
  Paper,
  Badge,
  Avatar,
  SimpleGrid,
} from "@mantine/core";
import { IconTrophy, IconUser, IconUsers } from "@tabler/icons-react";
import { notFound } from "next/navigation";
import ActivityFeed from "@/components/ActivityFeed";
import BackButton from "@/components/BackButton";
import { fetchFactionDetail } from "@/lib/factions";
import { fetchMembersByFaction } from "@/lib/members";

type FactionDetailPageProps = {
  params: Promise<{ id: string }>;
};

const RANK_LABELS: Record<number, string> = {
  1: "🥇 1er",
  2: "🥈 2ème",
  3: "🥉 3ème",
  4: "4ème",
};


export default async function FactionDetailPage({ params }: FactionDetailPageProps) {
  const { id } = await params;
  const [faction, members] = await Promise.all([
    fetchFactionDetail(id),
    fetchMembersByFaction(id),
  ]);

  if (!faction) notFound();

  const hexColor = faction.hexColor;

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-start">
        <BackButton href="/faction" label="Retour aux factions" />
      </Group>

      <Paper shadow="xs" p="xl" radius="md" withBorder>
        <Group justify="space-between" align="flex-start">
          <Group gap="md">
            <Avatar
              src={faction.logo}
              size="xl"
              radius="xl"
              style={faction.logo ? undefined : { backgroundColor: hexColor }}
            >
              {!faction.logo && (
                <Text fw={800} fz="xl" c="white">
                  {faction.name[0].toUpperCase()}
                </Text>
              )}
            </Avatar>
            <Stack gap={4}>
              <Title order={2}>{faction.name}</Title>
              <Text c="dimmed" fz="sm">
                Faction
              </Text>
            </Stack>
          </Group>

          <Stack gap="xs" align="flex-end">
            <Badge size="xl" variant="light" color={hexColor}>
              {RANK_LABELS[faction.rank] ?? `${faction.rank}ème`}
            </Badge>
            <Group gap="xs">
              <ThemeIcon size="sm" color={hexColor} variant="light">
                <IconTrophy size={12} />
              </ThemeIcon>
              <Text fw={800} fz="xl" style={{ color: hexColor }}>
                {faction.totalPoints.toLocaleString("fr-FR")} pts
              </Text>
            </Group>
          </Stack>
        </Group>
      </Paper>

      <Paper shadow="xs" p="md" radius="md" withBorder>
        <Group gap="sm" mb="md">
          <ThemeIcon size="sm" color={hexColor} variant="light">
            <IconUsers size={14} />
          </ThemeIcon>
          <Title order={4}>
            Membres ({members.length})
          </Title>
        </Group>
        {members.length === 0 ? (
          <Text fz="sm" c="dimmed">Aucun membre assigné à cette faction.</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="xs">
            {members.map((member) => (
              <Group key={member.id} gap="xs" p="xs"
                style={{ borderRadius: 8, background: "var(--mantine-color-gray-0)" }}
              >
                <ThemeIcon size="sm" radius="xl" color={hexColor} variant="light">
                  <IconUser size={12} />
                </ThemeIcon>
                <Text fz="sm" fw={500} style={{ flex: 1 }} lineClamp={1}>
                  {member.firstName} {member.lastName}
                </Text>
              </Group>
            ))}
          </SimpleGrid>
        )}
      </Paper>

      <Paper shadow="xs" p="md" radius="md" withBorder>
        <Title order={4} mb="md">
          Historique des Epitech Race
        </Title>
        <ActivityFeed scores={faction.scores} factionColor={hexColor} />
      </Paper>
    </Stack>
  );
}
