"use client";

import {
  Stack,
  Title,
  Text,
  Group,
  Paper,
  ThemeIcon,
  SimpleGrid,
  Box,
  Avatar,
  Button,
  Badge,
} from "@mantine/core";
import { IconShield, IconPencil } from "@tabler/icons-react";
import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import FactionEditModal from "@/components/admin/factions/FactionEditModal";
import type { FactionAdminRow } from "@/components/admin/factions/FactionEditModal";

type FactionsClientProps = {
  initialFactions: FactionAdminRow[];
};

export default function FactionsClient({ initialFactions }: FactionsClientProps) {
  const [factions, setFactions] = useState<FactionAdminRow[]>(initialFactions);
  const [editTarget, setEditTarget] = useState<FactionAdminRow | null>(null);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  function handleEdit(faction: FactionAdminRow) {
    setEditTarget(faction);
    openEdit();
  }

  function handleSaved(updated: FactionAdminRow) {
    setFactions((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    notifications.show({
      title: "Succès",
      message: `Faction « ${updated.name} » mise à jour.`,
      color: "green",
      autoClose: 3000,
    });
  }

  return (
    <>
      <Stack gap="xl">
        <Group gap="sm">
          <ThemeIcon size="xl" radius="md" color="violet">
            <IconShield size={22} />
          </ThemeIcon>
          <Stack gap={0}>
            <Title order={2}>Factions</Title>
            <Text c="dimmed" fz="sm">
              {factions.length} faction(s) — renommer ou mettre à jour le logo
            </Text>
          </Stack>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {factions.map((faction) => (
            <Paper key={faction.id} p="lg" withBorder>
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Group gap="sm" align="center" style={{ flex: 1, minWidth: 0 }}>
                  {faction.logo ? (
                    <Avatar src={faction.logo} size={44} radius="xl" style={{ flexShrink: 0 }} />
                  ) : (
                    <Box
                      w={44}
                      h={44}
                      style={{
                        borderRadius: "50%",
                        background: faction.color,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Text fw={700} fz="md" truncate>
                      {faction.name}
                    </Text>
                    <Group gap={6}>
                      <Badge
                        size="xs"
                        variant="dot"
                        style={{ "--badge-dot-size": "8px", color: faction.color } as React.CSSProperties}
                        color="gray"
                      >
                        {faction.color}
                      </Badge>
                      {faction.logo ? (
                        <Badge size="xs" color="teal" variant="light">Logo défini</Badge>
                      ) : (
                        <Badge size="xs" color="gray" variant="light">Pas de logo</Badge>
                      )}
                    </Group>
                  </Stack>
                </Group>

                <Button
                  variant="light"
                  color="violet"
                  size="xs"
                  leftSection={<IconPencil size={13} />}
                  onClick={() => handleEdit(faction)}
                  style={{ flexShrink: 0 }}
                >
                  Modifier
                </Button>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>
      </Stack>

      <FactionEditModal
        opened={editOpened}
        onClose={closeEdit}
        onSaved={handleSaved}
        faction={editTarget}
      />
    </>
  );
}
