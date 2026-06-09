"use client";

import { useState, useEffect } from "react";
import {
  Stack,
  Title,
  Text,
  Button,
  Group,
  Table,
  ActionIcon,
  ThemeIcon,
  Alert,
  Badge,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconQrcode,
  IconFileInfo,
  IconAlertCircle,
} from "@tabler/icons-react";
import InfoPageFormModal from "@/components/admin/info-pages/InfoPageFormModal";
import QrCodeModal from "@/components/admin/info-pages/QrCodeModal";
import type { InfoPage } from "@/types/info-page";

export default function InfoPagesClient() {
  const [pages, setPages] = useState<InfoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editPage, setEditPage] = useState<InfoPage | null>(null);
  const [qrPage, setQrPage] = useState<InfoPage | null>(null);

  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [qrOpened, { open: openQr, close: closeQr }] = useDisclosure(false);

  async function fetchPages() {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/info-pages");
      if (!res.ok) throw new Error("Erreur lors du chargement des pages.");
      const data = (await res.json()) as InfoPage[];
      setPages(data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchPages();
  }, []);

  function handleEdit(page: InfoPage) {
    setEditPage(page);
    openEdit();
  }

  function handleQr(page: InfoPage) {
    setQrPage(page);
    openQr();
  }

  async function handleDelete(page: InfoPage) {
    if (!confirm(`Supprimer la page « ${page.title} » ? Cette action est irréversible.`)) return;

    const res = await fetch(`/api/admin/info-pages/${page.id}`, { method: "DELETE" });
    if (!res.ok) {
      notifications.show({
        color: "red",
        title: "Erreur",
        message: "La suppression a échoué.",
      });
      return;
    }
    setPages((prev) => prev.filter((p) => p.id !== page.id));
    notifications.show({
      color: "green",
      title: "Page supprimée",
      message: `« ${page.title} » a été supprimée.`,
    });
  }

  function handleSaved(saved: InfoPage) {
    setPages((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? saved : p));
      }
      return [saved, ...prev];
    });
    notifications.show({
      color: "green",
      title: editPage ? "Page mise à jour" : "Page créée",
      message: `« ${saved.title} » a été ${editPage ? "mise à jour" : "créée"}.`,
    });
    setEditPage(null);
  }

  function handleCloseEdit() {
    closeEdit();
    setEditPage(null);
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <ThemeIcon size="xl" radius="md" color="blue">
            <IconFileInfo size={22} />
          </ThemeIcon>
          <Stack gap={0}>
            <Title order={2}>Pages d'information</Title>
            <Text c="dimmed" fz="sm">
              Créez des pages publiques accessibles via QR code.
            </Text>
          </Stack>
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Nouvelle page
        </Button>
      </Group>

      {fetchError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erreur">
          {fetchError}
        </Alert>
      )}

      {!loading && pages.length === 0 && !fetchError && (
        <Text c="dimmed" ta="center" py="xl">
          Aucune page créée pour l'instant.
        </Text>
      )}

      {pages.length > 0 && (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Titre</Table.Th>
              <Table.Th>Contenu</Table.Th>
              <Table.Th>Date de création</Table.Th>
              <Table.Th ta="right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pages.map((page) => (
              <Table.Tr key={page.id}>
                <Table.Td fw={500}>{page.title}</Table.Td>
                <Table.Td>
                  {page.content ? (
                    <Badge color="gray" variant="light">
                      {page.content.length} caractères
                    </Badge>
                  ) : (
                    <Text c="dimmed" fz="sm">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text fz="sm" c="dimmed">
                    {new Date(page.created_at).toLocaleDateString("fr-FR")}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <Tooltip label="QR code" withArrow>
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleQr(page)}
                      >
                        <IconQrcode size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Modifier" withArrow>
                      <ActionIcon
                        variant="light"
                        color="orange"
                        onClick={() => handleEdit(page)}
                      >
                        <IconPencil size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Supprimer" withArrow>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(page)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <InfoPageFormModal
        opened={createOpened}
        onClose={closeCreate}
        onSaved={handleSaved}
        page={null}
      />

      <InfoPageFormModal
        opened={editOpened}
        onClose={handleCloseEdit}
        onSaved={handleSaved}
        page={editPage}
      />

      {qrPage && (
        <QrCodeModal
          opened={qrOpened}
          onClose={closeQr}
          page={qrPage}
        />
      )}
    </Stack>
  );
}
