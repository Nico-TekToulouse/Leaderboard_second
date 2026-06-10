"use client";

import {
  Stack,
  Group,
  Title,
  ThemeIcon,
  Button,
  Table,
  Badge,
  ActionIcon,
  Paper,
  Box,
  LoadingOverlay,
  Text,
  Alert,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconClipboardList,
  IconPlus,
  IconEye,
  IconPencil,
  IconTrash,
  IconToggleLeft,
  IconToggleRight,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useState, useEffect, useCallback } from "react";
import type { Worksheet } from "@/types/worksheet";
import WorksheetFormModal from "./WorksheetFormModal";
import WorksheetResponsesModal from "./WorksheetResponsesModal";

type Faction = {
  id: string;
  name: string;
  color: string;
};

type WorksheetsClientProps = {
  factions: Faction[];
};

export default function WorksheetsClient({ factions }: WorksheetsClientProps) {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editWorksheet, setEditWorksheet] = useState<Worksheet | null>(null);
  const [viewResponsesWorksheet, setViewResponsesWorksheet] = useState<Worksheet | null>(null);

  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [responsesOpened, { open: openResponses, close: closeResponses }] = useDisclosure(false);

  const fetchWorksheets = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const res = await fetch("/api/admin/worksheets");
    if (!res.ok) {
      setFetchError("Impossible de charger les worksheets.");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as Worksheet[];
    setWorksheets(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWorksheets();
  }, [fetchWorksheets]);

  function handleEdit(ws: Worksheet) {
    setEditWorksheet(ws);
    openEdit();
  }

  function handleViewResponses(ws: Worksheet) {
    setViewResponsesWorksheet(ws);
    openResponses();
  }

  async function handleToggleActive(ws: Worksheet) {
    const res = await fetch(`/api/admin/worksheets/${ws.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ws, is_active: !ws.is_active }),
    });

    if (!res.ok) {
      notifications.show({ title: "Erreur", message: "Impossible de modifier le statut.", color: "red" });
      return;
    }

    const updated = (await res.json()) as Worksheet;
    setWorksheets((prev) =>
      prev.map((w) => {
        if (w.id === updated.id) return updated;
        if (updated.is_active) return { ...w, is_active: false };
        return w;
      })
    );
    notifications.show({
      title: updated.is_active ? "Worksheet activé" : "Worksheet désactivé",
      message: updated.is_active ? "Les stagiaires peuvent maintenant y accéder." : "Worksheet masqué.",
      color: updated.is_active ? "green" : "gray",
      autoClose: 3000,
    });
  }

  async function handleDelete(ws: Worksheet) {
    if (!confirm(`Supprimer le worksheet "${ws.title}" ? Cette action est irréversible.`)) return;

    const res = await fetch(`/api/admin/worksheets/${ws.id}`, { method: "DELETE" });
    if (!res.ok) {
      notifications.show({ title: "Erreur", message: "Impossible de supprimer.", color: "red" });
      return;
    }
    setWorksheets((prev) => prev.filter((w) => w.id !== ws.id));
    notifications.show({ title: "Supprimé", message: "Worksheet supprimé avec succès.", color: "green", autoClose: 3000 });
  }

  function handleSaved(saved: Worksheet) {
    setWorksheets((prev) => {
      const exists = prev.find((w) => w.id === saved.id);
      let next: Worksheet[];
      if (exists) {
        next = prev.map((w) => (w.id === saved.id ? saved : w));
      } else {
        next = [saved, ...prev];
      }
      if (saved.is_active) {
        next = next.map((w) => (w.id === saved.id ? w : { ...w, is_active: false }));
      }
      return next;
    });
    notifications.show({
      title: "Succès",
      message: editWorksheet ? "Worksheet mis à jour." : "Worksheet créé.",
      color: "green",
      autoClose: 3000,
    });
  }

  const rows = worksheets.map((ws) => (
    <Table.Tr key={ws.id}>
      <Table.Td fw={500}>{ws.title}</Table.Td>
      <Table.Td>
        <Badge color={ws.is_active ? "green" : "gray"} variant="light">
          {ws.is_active ? "Actif" : "Inactif"}
        </Badge>
      </Table.Td>
      <Table.Td c="dimmed" fz="sm">
        {new Date(ws.created_at).toLocaleDateString("fr-FR")}
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="blue"
            size="sm"
            aria-label={`Voir les réponses de ${ws.title}`}
            onClick={() => handleViewResponses(ws)}
          >
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            aria-label={`Modifier ${ws.title}`}
            onClick={() => handleEdit(ws)}
          >
            <IconPencil size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color={ws.is_active ? "orange" : "green"}
            size="sm"
            aria-label={ws.is_active ? `Désactiver ${ws.title}` : `Activer ${ws.title}`}
            onClick={() => handleToggleActive(ws)}
          >
            {ws.is_active ? <IconToggleRight size={16} /> : <IconToggleLeft size={16} />}
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            aria-label={`Supprimer ${ws.title}`}
            onClick={() => handleDelete(ws)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <ThemeIcon size="xl" radius="md" color="violet">
            <IconClipboardList size={22} />
          </ThemeIcon>
          <Stack gap={0}>
            <Title order={2}>Worksheets</Title>
            <Text c="dimmed" fz="sm">Activités interactives pour les stagiaires</Text>
          </Stack>
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Nouveau Worksheet
        </Button>
      </Group>

      {fetchError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {fetchError}
        </Alert>
      )}

      <Paper withBorder>
        <Box pos="relative" mih={80}>
          <LoadingOverlay visible={loading} />
          {!loading && worksheets.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              Aucun worksheet créé.
            </Text>
          ) : (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Titre</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th>Créé le</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          )}
        </Box>
      </Paper>

      <WorksheetFormModal
        opened={createOpened}
        onClose={closeCreate}
        onSaved={(saved) => { handleSaved(saved); closeCreate(); }}
        worksheet={null}
        factions={factions}
      />

      <WorksheetFormModal
        opened={editOpened}
        onClose={() => { setEditWorksheet(null); closeEdit(); }}
        onSaved={(saved) => { handleSaved(saved); setEditWorksheet(null); closeEdit(); }}
        worksheet={editWorksheet}
        factions={factions}
      />

      <WorksheetResponsesModal
        opened={responsesOpened}
        onClose={() => { setViewResponsesWorksheet(null); closeResponses(); }}
        worksheet={viewResponsesWorksheet}
      />
    </Stack>
  );
}
