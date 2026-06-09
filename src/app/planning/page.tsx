import { Stack, Group, ThemeIcon, Title, Text } from "@mantine/core";
import { IconCalendar } from "@tabler/icons-react";
import { fetchPlannedActivities } from "@/lib/planning";
import PlannedActivityList from "@/components/PlannedActivityList";
import ErrorAlert from "@/components/ErrorAlert";

// Le teaser dépend du jour courant — rendu frais à chaque requête
export const dynamic = "force-dynamic";

export default async function PlanningPage() {
  const activities = await fetchPlannedActivities();

  return (
    <Stack gap="xl">
      <Group gap="sm">
        <ThemeIcon size="xl" radius="md" color="blue">
          <IconCalendar size={22} />
        </ThemeIcon>
        <Stack gap={0}>
          <Title order={2}>Planning des Epitech Race</Title>
          <Text c="dimmed" fz="sm">
            Toutes les Epitech Race du stage — révélées la veille
          </Text>
        </Stack>
      </Group>

      {activities.length === 0 ? (
        <ErrorAlert
          title="Aucune Epitech Race planifiée"
          message="Aucune Epitech Race n'a encore été créée. Les Epitech Race s'ajoutent depuis l'interface admin."
        />
      ) : (
        <PlannedActivityList activities={activities} />
      )}
    </Stack>
  );
}
