"use client";

import {
  Modal,
  Button,
  Group,
  Text,
  Stack,
  ThemeIcon,
  Alert,
} from "@mantine/core";
import { IconTrash, IconAlertTriangle } from "@tabler/icons-react";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import type { ActivityWithScores } from "@/types/activity";

type DeleteActivityModalProps = {
  opened: boolean;
  onClose: () => void;
  onDeleted: () => void;
  activity: ActivityWithScores | null;
};

export default function DeleteActivityModal({
  opened,
  onClose,
  onDeleted,
  activity,
}: DeleteActivityModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!activity) return;
    setLoading(true);

    const res = await fetch(`/api/admin/activities/${activity.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      notifications.show({
        title: "Erreur",
        message: data.error ?? "Impossible de supprimer l'activité.",
        color: "red",
        autoClose: 4000,
      });
      setLoading(false);
      return;
    }

    setLoading(false);
    onDeleted();
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon color="red" variant="light" size="md">
            <IconTrash size={16} />
          </ThemeIcon>
          <Text fw={600}>Supprimer l&apos;activité</Text>
        </Group>
      }
      size="sm"
    >
      <Stack gap="md">
        <Alert
          icon={<IconAlertTriangle size={16} />}
          color="red"
          variant="light"
        >
          Cette action est irréversible. Tous les scores associés à cette activité seront
          également supprimés.
        </Alert>

        {activity && (
          <Text fz="sm">
            Êtes-vous sûr de vouloir supprimer l&apos;activité{" "}
            <Text component="span" fw={700}>
              {activity.name}
            </Text>{" "}
            du {new Date(activity.date).toLocaleDateString("fr-FR")} ?
          </Text>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button color="red" onClick={handleDelete} loading={loading} leftSection={<IconTrash size={16} />}>
            Supprimer
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
