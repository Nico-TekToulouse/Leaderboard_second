"use client";

import {
  Stack,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Paper,
  Alert,
  ThemeIcon,
  SimpleGrid,
  Badge,
  LoadingOverlay,
  Box,
} from "@mantine/core";
import {
  IconUsers,
  IconPlus,
  IconSearch,
  IconUpload,
  IconAlertCircle,
  IconTrash,
  IconUsersGroup,
  IconX,
  IconList,
} from "@tabler/icons-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import UserTable from "@/components/admin/users/UserTable";
import UserFormModal from "@/components/admin/users/UserFormModal";
import DeleteUserModal from "@/components/admin/users/DeleteUserModal";
import ImportUsersModal from "@/components/admin/users/ImportUsersModal";
import DuplicateResolutionModal from "@/components/admin/users/DuplicateResolutionModal";
import BulkDeleteUsersModal from "@/components/admin/users/BulkDeleteUsersModal";
import BulkReassignFactionModal from "@/components/admin/users/BulkReassignFactionModal";
import SelectedUsersDrawer from "@/components/admin/users/SelectedUsersDrawer";
import type {
  UserWithFaction,
  PaginatedUsers,
  DuplicateConflict,
  ImportRow,
} from "@/types/user";

type Faction = {
  id: string;
  name: string;
  color: string;
};

type UsersClientProps = {
  factions: Faction[];
};

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 350;

export default function UsersClient({ factions }: UsersClientProps) {
  const [users, setUsers] = useState<UserWithFaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sélection persistante : Map id → user pour conserver les profils entre les pages
  const [selected, setSelected] = useState<Map<string, UserWithFaction>>(new Map());

  const [editUser, setEditUser] = useState<UserWithFaction | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserWithFaction | null>(null);
  const [duplicateConflicts, setDuplicateConflicts] = useState<DuplicateConflict[]>([]);
  const [allImportRows, setAllImportRows] = useState<ImportRow[]>([]);

  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);
  const [duplicateOpened, { open: openDuplicate, close: closeDuplicate }] = useDisclosure(false);
  const [bulkDeleteOpened, { open: openBulkDelete, close: closeBulkDelete }] = useDisclosure(false);
  const [bulkReassignOpened, { open: openBulkReassign, close: closeBulkReassign }] = useDisclosure(false);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  const fetchUsers = useCallback(async (currentPage: number, currentSearch: string) => {
    setLoading(true);
    setFetchError(null);

    const params = new URLSearchParams({
      page: String(currentPage),
      pageSize: String(PAGE_SIZE),
      search: currentSearch,
    });

    const res = await fetch(`/api/admin/users?${params.toString()}`);
    if (!res.ok) {
      setFetchError("Impossible de charger les utilisateurs.");
      setLoading(false);
      return;
    }

    const data = (await res.json()) as PaginatedUsers;
    setUsers(data.data);
    setTotal(data.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers(1, "");
  }, [fetchUsers]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1, value.trim());
    }, DEBOUNCE_MS);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    fetchUsers(newPage, search);
  }

  function handleEdit(user: UserWithFaction) {
    setEditUser(user);
    openEdit();
  }

  function handleDelete(user: UserWithFaction) {
    setDeleteUser(user);
    openDelete();
  }

  function handleDuplicatesFound(conflicts: DuplicateConflict[], rows: ImportRow[]) {
    setDuplicateConflicts(conflicts);
    setAllImportRows(rows);
    openDuplicate();
  }

  function refresh(message?: string) {
    fetchUsers(page, search);
    if (message) {
      notifications.show({
        title: "Succès",
        message,
        color: "green",
        autoClose: 3000,
      });
    }
  }

  // --- Gestion de la sélection ---

  function toggleRow(user: UserWithFaction) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) {
        next.delete(user.id);
      } else {
        next.set(user.id, user);
      }
      return next;
    });
  }

  function toggleAllOnPage(checked: boolean) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (checked) {
        users.forEach((u) => next.set(u.id, u));
      } else {
        users.forEach((u) => next.delete(u.id));
      }
      return next;
    });
  }

  function removeFromSelection(userId: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Map());
  }

  const selectedIds = new Set(selected.keys());
  const selectedUsers = Array.from(selected.values());

  // Stats par faction (calculées depuis la liste courante)
  const factionStats = factions.map((f) => ({
    ...f,
    count: users.filter((u) => u.faction_id === f.id).length,
  }));

  return (
    <>
      <Stack gap="xl">
        {/* En-tête */}
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="sm">
            <ThemeIcon size="xl" radius="md" color="blue">
              <IconUsers size={22} />
            </ThemeIcon>
            <Stack gap={0}>
              <Title order={2}>Utilisateurs</Title>
              <Text c="dimmed" fz="sm">
                {total} élève(s) enregistré(s)
              </Text>
            </Stack>
          </Group>

          <Group gap="sm">
            <Button
              variant="outline"
              leftSection={<IconUpload size={16} />}
              onClick={openImport}
            >
              Importer
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
              Ajouter
            </Button>
          </Group>
        </Group>

        {/* Stats factions */}
        {factionStats.length > 0 && !fetchError && (
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            {factionStats.map((f) => (
              <Paper key={f.id} withBorder p="sm" radius="md">
                <Group gap="xs" mb={4}>
                  <Box
                    w={10}
                    h={10}
                    style={{ borderRadius: "50%", background: f.color, flexShrink: 0 }}
                  />
                  <Text fz="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: 0.5 }}>
                    {f.name}
                  </Text>
                </Group>
                <Text fw={700} fz="xl">
                  {f.count}
                </Text>
                <Text fz="xs" c="dimmed">
                  élève(s) — page courante
                </Text>
              </Paper>
            ))}
          </SimpleGrid>
        )}

        {fetchError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {fetchError}
          </Alert>
        )}

        {/* Barre d'actions groupées (visible uniquement si sélection non vide) */}
        {selected.size > 0 && (
          <Paper withBorder p="sm" radius="md" bg="light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-5))">
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Group gap="sm" wrap="wrap">
                <Badge size="lg" variant="filled" color="blue" radius="sm">
                  {selected.size} sélectionné(s)
                </Badge>
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  leftSection={<IconX size={14} />}
                  onClick={clearSelection}
                >
                  Effacer la sélection
                </Button>
              </Group>
              <Group gap="sm" wrap="wrap">
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconList size={14} />}
                  onClick={openDrawer}
                >
                  Voir les profils
                </Button>
                <Button
                  variant="light"
                  color="teal"
                  size="xs"
                  leftSection={<IconUsersGroup size={14} />}
                  onClick={openBulkReassign}
                >
                  Réassigner la faction
                </Button>
                <Button
                  variant="light"
                  color="red"
                  size="xs"
                  leftSection={<IconTrash size={14} />}
                  onClick={openBulkDelete}
                >
                  Supprimer
                </Button>
              </Group>
            </Group>
          </Paper>
        )}

        {/* Table */}
        <Paper p="md" withBorder>
          <TextInput
            placeholder="Rechercher par nom, prénom ou email…"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            mb="md"
            rightSection={
              search ? (
                <Badge
                  size="xs"
                  variant="light"
                  color="blue"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSearchChange("")}
                >
                  ✕
                </Badge>
              ) : null
            }
          />

          <Box pos="relative">
            <LoadingOverlay
              visible={loading}
              overlayProps={{ blur: 1 }}
              loaderProps={{ size: "sm" }}
            />
            <UserTable
              users={users}
              total={total}
              page={page}
              pageSize={PAGE_SIZE}
              selectedIds={selectedIds}
              onPageChange={handlePageChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleRow={toggleRow}
              onToggleAllOnPage={toggleAllOnPage}
            />
          </Box>
        </Paper>
      </Stack>

      <UserFormModal
        opened={createOpened}
        onClose={closeCreate}
        onSaved={() => refresh("Utilisateur créé avec succès.")}
        user={null}
        factions={factions}
      />

      <UserFormModal
        opened={editOpened}
        onClose={closeEdit}
        onSaved={() => refresh("Utilisateur mis à jour.")}
        user={editUser}
        factions={factions}
      />

      <DeleteUserModal
        opened={deleteOpened}
        onClose={closeDelete}
        onDeleted={() => refresh("Utilisateur supprimé.")}
        user={deleteUser}
      />

      <ImportUsersModal
        opened={importOpened}
        onClose={closeImport}
        onImported={(count) => {
          refresh(`${count} utilisateur(s) importé(s) avec succès.`);
        }}
        factions={factions}
        onDuplicatesFound={handleDuplicatesFound}
      />

      <DuplicateResolutionModal
        opened={duplicateOpened}
        onClose={closeDuplicate}
        onResolved={(count) => refresh(`${count} utilisateur(s) traité(s).`)}
        duplicates={duplicateConflicts}
        allRows={allImportRows}
      />

      <BulkDeleteUsersModal
        opened={bulkDeleteOpened}
        onClose={closeBulkDelete}
        onDeleted={(count) => {
          const deletedIds = new Set(selectedUsers.map((u) => u.id));
          setUsers((prev) => prev.filter((u) => !deletedIds.has(u.id)));
          setTotal((prev) => prev - count);
          clearSelection();
          notifications.show({
            title: "Succès",
            message: `${count} élève(s) supprimé(s).`,
            color: "green",
            autoClose: 3000,
          });
        }}
        users={selectedUsers}
      />

      <BulkReassignFactionModal
        opened={bulkReassignOpened}
        onClose={closeBulkReassign}
        onReassigned={(count, factionId) => {
          const reassignedIds = new Set(selectedUsers.map((u) => u.id));
          const newFaction = factions.find((f) => f.id === factionId) ?? null;
          setUsers((prev) =>
            prev.map((u) =>
              reassignedIds.has(u.id)
                ? {
                    ...u,
                    faction_id: newFaction?.id ?? null,
                    faction: newFaction
                      ? { id: newFaction.id, name: newFaction.name, color: newFaction.color }
                      : null,
                  }
                : u
            )
          );
          clearSelection();
          notifications.show({
            title: "Succès",
            message: `${count} élève(s) réassigné(s).`,
            color: "green",
            autoClose: 3000,
          });
        }}
        users={selectedUsers}
        factions={factions}
      />

      <SelectedUsersDrawer
        opened={drawerOpened}
        onClose={closeDrawer}
        users={selectedUsers}
        onRemove={removeFromSelection}
      />
    </>
  );
}
