"use client";

import {
  Table,
  TableThead,
  TableTr,
  TableTh,
  TableTbody,
  TableTd,
  Badge,
  ActionIcon,
  Group,
  Text,
  Tooltip,
  Pagination,
  Center,
  Stack,
  Avatar,
  Skeleton,
} from "@mantine/core";
import { IconEdit, IconTrash, IconUserOff } from "@tabler/icons-react";
import type { UserWithFaction } from "@/types/user";

type UserTableProps = {
  users: UserWithFaction[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (user: UserWithFaction) => void;
  onDelete: (user: UserWithFaction) => void;
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableTr key={i}>
          <TableTd>
            <Group gap="sm" wrap="nowrap">
              <Skeleton circle h={32} w={32} />
              <Skeleton h={12} w={80} />
            </Group>
          </TableTd>
          <TableTd><Skeleton h={12} w={90} /></TableTd>
          <TableTd><Skeleton h={12} w={160} /></TableTd>
          <TableTd><Skeleton h={20} w={60} radius="xl" /></TableTd>
          <TableTd>
            <Group gap={4}>
              <Skeleton circle h={24} w={24} />
              <Skeleton circle h={24} w={24} />
            </Group>
          </TableTd>
        </TableTr>
      ))}
    </>
  );
}

export default function UserTable({
  users,
  total,
  page,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
}: UserTableProps) {
  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <Stack gap="md">
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <TableThead>
          <TableTr>
            <TableTh>Prénom</TableTh>
            <TableTh>Nom</TableTh>
            <TableTh>Email</TableTh>
            <TableTh>Faction</TableTh>
            <TableTh style={{ width: 90 }}>Actions</TableTh>
          </TableTr>
        </TableThead>
        <TableTbody>
          {users.length === 0 ? (
            <TableTr>
              <TableTd colSpan={5}>
                <Center py="xl">
                  <Stack align="center" gap="xs">
                    <IconUserOff size={32} color="var(--mantine-color-gray-4)" />
                    <Text c="dimmed" fz="sm">
                      Aucun utilisateur trouvé.
                    </Text>
                  </Stack>
                </Center>
              </TableTd>
            </TableTr>
          ) : (
            users.map((user) => (
              <TableTr key={user.id}>
                <TableTd>
                  <Group gap="sm" wrap="nowrap">
                    <Avatar
                      size="sm"
                      radius="xl"
                      color={user.faction?.color ?? "blue"}
                      variant="filled"
                    >
                      {getInitials(user.first_name, user.last_name)}
                    </Avatar>
                    <Text fz="sm" fw={500}>
                      {user.first_name}
                    </Text>
                  </Group>
                </TableTd>
                <TableTd>
                  <Text fz="sm">{user.last_name}</Text>
                </TableTd>
                <TableTd>
                  <Text fz="sm" c="dimmed">
                    {user.email}
                  </Text>
                </TableTd>
                <TableTd>
                  {user.faction ? (
                    <Badge color={user.faction.color} variant="light" size="sm">
                      {user.faction.name}
                    </Badge>
                  ) : (
                    <Text fz="xs" c="dimmed">
                      —
                    </Text>
                  )}
                </TableTd>
                <TableTd>
                  <Group gap={4} wrap="nowrap">
                    <Tooltip label="Modifier">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        size="sm"
                        onClick={() => onEdit(user)}
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Supprimer">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => onDelete(user)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </TableTd>
              </TableTr>
            ))
          )}
        </TableTbody>
      </Table>

      {total > 0 && (
        <Group justify="space-between" align="center">
          <Text fz="xs" c="dimmed">
            {from}–{to} sur {total} utilisateur(s)
          </Text>
          {totalPages > 1 && (
            <Pagination total={totalPages} value={page} onChange={onPageChange} size="sm" />
          )}
        </Group>
      )}
    </Stack>
  );
}

export { SkeletonRows };
