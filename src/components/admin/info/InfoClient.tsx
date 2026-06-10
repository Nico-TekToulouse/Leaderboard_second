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
  Tabs,
  TabsList,
  TabsTab,
  TabsPanel,
  ActionIcon,
  Table,
  TableThead,
  TableTbody,
  TableTr,
  TableTh,
  TableTd,
  Badge,
  Box,
  LoadingOverlay,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconPlus,
  IconAlertCircle,
  IconFileText,
  IconAlertTriangle,
  IconBrandDiscord,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { useState, useEffect, useCallback } from "react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import InfoFormModal from "@/components/admin/info/InfoFormModal";
import type { InfoEntry, InfoCategory } from "@/types/info";

const TABS: { value: InfoCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "rules", label: "Règlement", icon: <IconFileText size={16} />, color: "blue" },
  { value: "sanctions", label: "Sanctions", icon: <IconAlertTriangle size={16} />, color: "orange" },
  { value: "discord", label: "Discord", icon: <IconBrandDiscord size={16} />, color: "indigo" },
];

export default function InfoClient() {
  const [entries, setEntries] = useState<InfoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InfoCategory>("rules");

  const [editEntry, setEditEntry] = useState<InfoEntry | null>(null);
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    const res = await fetch("/api/admin/info");
    if (!res.ok) {
      setFetchError("Impossible de charger les informations.");
      setLoading(false);
      return;
    }

    const data = (await res.json()) as InfoEntry[];
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function handleEdit(entry: InfoEntry) {
    setEditEntry(entry);
    openEdit();
  }

  async function handleDelete(entry: InfoEntry) {
    if (!confirm(`Supprimer "${entry.title}" ?`)) return;

    const res = await fetch(`/api/admin/info/${entry.id}`, { method: "DELETE" });
    if (!res.ok) {
      notifications.show({ title: "Erreur", message: "Impossible de supprimer l'entrée.", color: "red" });
      return;
    }

    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    notifications.show({ title: "Supprimé", message: `"${entry.title}" a été supprimé.`, color: "green", autoClose: 3000 });
  }

  function handleSaved(saved: InfoEntry) {
    setEntries((prev) => {
      const exists = prev.find((e) => e.id === saved.id);
      if (exists) return prev.map((e) => (e.id === saved.id ? saved : e));
      return [...prev, saved].sort((a, b) => a.order - b.order);
    });
    notifications.show({
      title: "Succès",
      message: editEntry ? "Entrée mise à jour." : "Entrée créée.",
      color: "green",
      autoClose: 3000,
    });
  }

  const tabEntries = entries.filter((e) => e.category === activeTab);
  const total = entries.length;

  return (
    <>
      <Stack gap="xl">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="sm">
            <ThemeIcon size="xl" radius="md" color="blue">
              <IconInfoCircle size={22} />
            </ThemeIcon>
            <Stack gap={0}>
              <Title order={2}>Informations utiles</Title>
              <Text c="dimmed" fz="sm">
                {total} entrée(s) au total
              </Text>
            </Stack>
          </Group>

          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Nouvelle entrée
          </Button>
        </Group>

        {fetchError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {fetchError}
          </Alert>
        )}

        <Paper withBorder>
          <Tabs
            value={activeTab}
            onChange={(v) => setActiveTab((v as InfoCategory) ?? "rules")}
          >
            <TabsList>
              {TABS.map((tab) => (
                <TabsTab
                  key={tab.value}
                  value={tab.value}
                  leftSection={tab.icon}
                >
                  {tab.label}
                  <Badge size="xs" ml="xs" color={tab.color} variant="light">
                    {entries.filter((e) => e.category === tab.value).length}
                  </Badge>
                </TabsTab>
              ))}
            </TabsList>

            {TABS.map((tab) => (
              <TabsPanel key={tab.value} value={tab.value} p="md">
                <Box pos="relative" mih={80}>
                  <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} loaderProps={{ size: "sm" }} />
                  {!loading && tabEntries.length === 0 ? (
                    <Text c="dimmed" fz="sm" ta="center" py="xl">
                      Aucune entrée dans cette catégorie.
                    </Text>
                  ) : (
                    <Table highlightOnHover>
                      <TableThead>
                        <TableTr>
                          <TableTh>Titre</TableTh>
                          <TableTh>Description</TableTh>
                          {tab.value === "discord" && <TableTh>Lien</TableTh>}
                          <TableTh style={{ width: 60 }}>Ordre</TableTh>
                          <TableTh style={{ width: 80 }} />
                        </TableTr>
                      </TableThead>
                      <TableTbody>
                        {tabEntries.map((entry) => (
                          <TableTr key={entry.id}>
                            <TableTd fw={500}>{entry.title}</TableTd>
                            <TableTd>
                              <Text fz="sm" c="dimmed" lineClamp={2}>
                                {entry.content || "—"}
                              </Text>
                            </TableTd>
                            {tab.value === "discord" && (
                              <TableTd>
                                <Text fz="sm" c="blue" lineClamp={1}>
                                  {entry.url || "—"}
                                </Text>
                              </TableTd>
                            )}
                            <TableTd>
                              <Text fz="sm" ta="center">{entry.order}</Text>
                            </TableTd>
                            <TableTd>
                              <Group gap="xs" justify="flex-end">
                                <ActionIcon
                                  variant="subtle"
                                  color="blue"
                                  onClick={() => handleEdit(entry)}
                                  aria-label={`Modifier ${entry.title}`}
                                >
                                  <IconPencil size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  onClick={() => handleDelete(entry)}
                                  aria-label={`Supprimer ${entry.title}`}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </TableTd>
                          </TableTr>
                        ))}
                      </TableTbody>
                    </Table>
                  )}
                </Box>
              </TabsPanel>
            ))}
          </Tabs>
        </Paper>
      </Stack>

      <InfoFormModal
        opened={createOpened}
        onClose={closeCreate}
        onSaved={handleSaved}
        entry={null}
        defaultCategory={activeTab}
      />

      <InfoFormModal
        opened={editOpened}
        onClose={() => { closeEdit(); setEditEntry(null); }}
        onSaved={handleSaved}
        entry={editEntry}
      />
    </>
  );
}
