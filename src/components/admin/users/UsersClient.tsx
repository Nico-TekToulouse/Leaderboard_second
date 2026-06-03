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
} from "@tabler/icons-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import UserTable from "@/components/admin/users/UserTable";
import UserFormModal from "@/components/admin/users/UserFormModal";
import DeleteUserModal from "@/components/admin/users/DeleteUserModal";
import ImportUsersModal from "@/components/admin/users/ImportUsersModal";
import DuplicateResolutionModal from "@/components/admin/users/DuplicateResolutionModal";
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

  const [editUser, setEditUser] = useState<UserWithFaction | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserWithFaction | null>(null);
  const [duplicateConflicts, setDuplicateConflicts] = useState<DuplicateConflict[]>([]);
  const [allImportRows, setAllImportRows] = useState<ImportRow[]>([]);

  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);
  const [duplicateOpened, { open: openDuplicate, close: closeDuplicate }] = useDisclosure(false);

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

  // Stats par faction (calculées depuis la liste courante ou on les affiche globalement)
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

        {/* Table */}
        <Paper shadow="xs" p="md" radius="md" withBorder>
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
              onPageChange={handlePageChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
    </>
  );
}
