"use client";

import {
  Stack,
  Title,
  Text,
  Group,
  Button,
  Paper,
  Alert,
  ThemeIcon,
  Box,
  LoadingOverlay,
} from "@mantine/core";
import {
  IconTrophy,
  IconPlus,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useState, useCallback, useEffect } from "react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import ActivityTable from "@/components/admin/activities/ActivityTable";
import ActivityFormModal from "@/components/admin/activities/ActivityFormModal";
import DeleteActivityModal from "@/components/admin/activities/DeleteActivityModal";
import type { ActivityWithScores, PaginatedActivities } from "@/types/activity";

type Faction = {
  id: string;
  name: string;
  color: string;
};

type ActivitiesClientProps = {
  factions: Faction[];
};

const PAGE_SIZE = 20;

export default function ActivitiesClient({ factions }: ActivitiesClientProps) {
  const [activities, setActivities] = useState<ActivityWithScores[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [editActivity, setEditActivity] = useState<ActivityWithScores | null>(null);
  const [deleteActivity, setDeleteActivity] = useState<ActivityWithScores | null>(null);

  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const fetchActivities = useCallback(async (currentPage: number) => {
    setLoading(true);
    setFetchError(null);

    const params = new URLSearchParams({
      page: String(currentPage),
      pageSize: String(PAGE_SIZE),
    });

    const res = await fetch(`/api/admin/activities?${params.toString()}`);
    if (!res.ok) {
      setFetchError("Impossible de charger les activités.");
      setLoading(false);
      return;
    }

    const data = (await res.json()) as PaginatedActivities;
    setActivities(data.data);
    setTotal(data.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActivities(1);
  }, [fetchActivities]);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    fetchActivities(newPage);
  }

  function handleEdit(activity: ActivityWithScores) {
    setEditActivity(activity);
    openEdit();
  }

  function handleDelete(activity: ActivityWithScores) {
    setDeleteActivity(activity);
    openDelete();
  }

  function refresh(message?: string) {
    fetchActivities(page);
    if (message) {
      notifications.show({
        title: "Succès",
        message,
        color: "green",
        autoClose: 3000,
      });
    }
  }

  return (
    <>
      <Stack gap="xl">
        {/* En-tête */}
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="sm">
            <ThemeIcon size="xl" radius="md" color="orange">
              <IconTrophy size={22} />
            </ThemeIcon>
            <Stack gap={0}>
              <Title order={2}>Epitech Race</Title>
              <Text c="dimmed" fz="sm">
                {total} Epitech Race enregistrée(s)
              </Text>
            </Stack>
          </Group>

          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Nouvelle Epitech Race
          </Button>
        </Group>

        {fetchError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {fetchError}
          </Alert>
        )}

        {/* Table */}
        <Paper shadow="xs" p="md" radius="md" withBorder>
          <Box pos="relative">
            <LoadingOverlay
              visible={loading}
              overlayProps={{ blur: 1 }}
              loaderProps={{ size: "sm" }}
            />
            <ActivityTable
              activities={activities}
              total={total}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Box>
        </Paper>
      </Stack>

      <ActivityFormModal
        opened={createOpened}
        onClose={closeCreate}
        onSaved={() => refresh("Epitech Race créée avec succès.")}
        activity={null}
        factions={factions}
      />

      <ActivityFormModal
        opened={editOpened}
        onClose={closeEdit}
        onSaved={() => refresh("Epitech Race mise à jour.")}
        activity={editActivity}
        factions={factions}
      />

      <DeleteActivityModal
        opened={deleteOpened}
        onClose={closeDelete}
        onDeleted={() => refresh("Epitech Race supprimée.")}
        activity={deleteActivity}
      />
    </>
  );
}
