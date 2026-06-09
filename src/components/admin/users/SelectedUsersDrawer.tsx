"use client";

import {
  Drawer,
  Stack,
  Group,
  Text,
  Avatar,
  Badge,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Divider,
  Center,
} from "@mantine/core";
import { IconX, IconUserOff } from "@tabler/icons-react";
import type { UserWithFaction } from "@/types/user";

type SelectedUsersDrawerProps = {
  opened: boolean;
  onClose: () => void;
  users: UserWithFaction[];
  onRemove: (userId: string) => void;
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function SelectedUsersDrawer({
  opened,
  onClose,
  users,
  onRemove,
}: SelectedUsersDrawerProps) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={600}>
          Sélection —{" "}
          <Text span c="dimmed" fw={400} fz="sm">
            {users.length} élève(s)
          </Text>
        </Text>
      }
      position="right"
      size="sm"
      padding="md"
    >
      <ScrollArea h="calc(100vh - 80px)" offsetScrollbars>
        {users.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <IconUserOff size={32} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed" fz="sm">
                Aucun élève sélectionné.
              </Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap={0}>
            {users.map((user, index) => (
              <div key={user.id}>
                {index > 0 && <Divider />}
                <Group justify="space-between" py="xs" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    <Avatar
                      size="sm"
                      radius="xl"
                      color={user.faction?.color ?? "blue"}
                      variant="filled"
                      style={{ flexShrink: 0 }}
                    >
                      {getInitials(user.first_name, user.last_name)}
                    </Avatar>
                    <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                      <Text fz="sm" fw={500} truncate>
                        {user.first_name} {user.last_name}
                      </Text>
                      <Text fz="xs" c="dimmed" truncate>
                        {user.email}
                      </Text>
                      {user.faction && (
                        <Badge
                          color={user.faction.color}
                          variant="light"
                          size="xs"
                          mt={2}
                          style={{ width: "fit-content" }}
                        >
                          {user.faction.name}
                        </Badge>
                      )}
                    </Stack>
                  </Group>
                  <Tooltip label="Retirer de la sélection">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      style={{ flexShrink: 0 }}
                      onClick={() => onRemove(user.id)}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </div>
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Drawer>
  );
}
