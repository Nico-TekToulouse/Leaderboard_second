import {
  Title,
  Text,
  Stack,
  Group,
  ThemeIcon,
  SimpleGrid,
} from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";
import FactionCard from "@/components/FactionCard";
import ErrorAlert from "@/components/ErrorAlert";
import LeaderboardTabs from "@/components/LeaderboardTabs";
import { fetchFactionLeaderboard, fetchAllFactionScores } from "@/lib/factions";

export default async function Home() {
  const [factions, chartData] = await Promise.all([
    fetchFactionLeaderboard(),
    fetchAllFactionScores(),
  ]);

  return (
    <Stack gap="xl">
      <Group gap="sm">
        <ThemeIcon size="xl" radius="md" color="blue">
          <IconTrophy size={22} />
        </ThemeIcon>
        <Stack gap={0}>
          <Title order={2}>Leaderboard Global</Title>
          <Text c="dimmed" fz="sm">
            Classement des 4 factions en temps réel
          </Text>
        </Stack>
      </Group>

      {factions.length === 0 ? (
        <ErrorAlert
          title="Données indisponibles"
          message="Impossible de charger les factions depuis la base de données."
        />
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {factions.map((faction, index) => (
              <FactionCard
                key={faction.id}
                id={faction.id}
                name={faction.name}
                hexColor={faction.hexColor}
                logo={faction.logo}
                totalPoints={faction.totalPoints}
                rank={index + 1}
              />
            ))}
          </SimpleGrid>

          <LeaderboardTabs
            factions={factions}
            byActivity={chartData.byActivity}
            byDay={chartData.byDay}
            factionSeries={chartData.factionSeries}
          />
        </>
      )}
    </Stack>
  );
}
