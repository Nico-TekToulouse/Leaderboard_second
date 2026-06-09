import { fetchActiveWorksheet } from "@/lib/worksheets";
import { createServerClient } from "@/lib/supabase-server";
import WorksheetView from "@/components/WorksheetView";
import { Stack, Group, ThemeIcon, Title, Text, Paper } from "@mantine/core";
import { IconClipboardList } from "@tabler/icons-react";

export const dynamic = "force-dynamic";

type Faction = {
  id: string;
  name: string;
  color: string;
};

export default async function ActivitePage() {
  const supabase = createServerClient();

  const [worksheet, factionsRes] = await Promise.all([
    fetchActiveWorksheet(),
    supabase.from("factions").select("id, name, color").order("name"),
  ]);

  const factions = (factionsRes.data as Faction[]) ?? [];

  return (
    <Stack gap="xl">
      <Group gap="sm">
        <ThemeIcon size="xl" radius="md" color="violet">
          <IconClipboardList size={22} />
        </ThemeIcon>
        <Stack gap={0}>
          <Title order={2}>Activité en cours</Title>
          <Text c="dimmed" fz="sm">Worksheet interactif</Text>
        </Stack>
      </Group>

      {!worksheet ? (
        <Paper shadow="xs" p="xl" radius="md" withBorder>
          <Text c="dimmed" ta="center">Aucune activité en cours pour le moment.</Text>
        </Paper>
      ) : (
        <WorksheetView worksheet={worksheet} factions={factions} />
      )}
    </Stack>
  );
}
