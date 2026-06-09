"use client";

import {
  Title,
  Text,
  Stack,
  SimpleGrid,
  Paper,
  ThemeIcon,
  Group,
} from "@mantine/core";
import { IconUsers, IconSettings, IconTrophy, IconShield, IconQrcode } from "@tabler/icons-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <Stack gap="xl">
      <Group gap="sm">
        <ThemeIcon size="xl" radius="md" color="blue">
          <IconSettings size={22} />
        </ThemeIcon>
        <Stack gap={0}>
          <Title order={2}>Administration</Title>
          <Text c="dimmed" fz="sm">
            Gestion du leaderboard Epitech
          </Text>
        </Stack>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <Paper
          component={Link}
          href="/admin/factions"
          shadow="xs"
          p="lg"
          radius="md"
          withBorder
          style={{ textDecoration: "none", cursor: "pointer" }}
        >
          <Group gap="sm" mb="xs">
            <ThemeIcon size="lg" radius="md" color="violet" variant="light">
              <IconShield size={24} />
            </ThemeIcon>
            <Title order={4}>Factions</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            Renommer les factions et mettre à jour leur logo.
          </Text>
        </Paper>
        <Paper
          component={Link}
          href="/admin/users"
          shadow="xs"
          p="lg"
          radius="md"
          withBorder
          style={{ textDecoration: "none", cursor: "pointer" }}
        >
          <Group gap="sm" mb="xs">
            <ThemeIcon size="lg" radius="md" color="blue" variant="light">
              <IconUsers size={24} />
            </ThemeIcon>
            <Title order={4}>Utilisateurs</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            Gérer les 120 élèves, leurs factions et importer des listes.
          </Text>
        </Paper>

        <Paper
          component={Link}
          href="/admin/activities"
          shadow="xs"
          p="lg"
          radius="md"
          withBorder
          style={{ textDecoration: "none", cursor: "pointer" }}
        >
          <Group gap="sm" mb="xs">
            <ThemeIcon size="lg" radius="md" color="orange" variant="light">
              <IconTrophy size={24} />
            </ThemeIcon>
            <Title order={4}>Epitech Race</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            Ajouter des Epitech Race et attribuer des points aux factions.
          </Text>
        </Paper>
        <Paper
          component={Link}
          href="/admin/info-pages"
          shadow="xs"
          p="lg"
          radius="md"
          withBorder
          style={{ textDecoration: "none", cursor: "pointer" }}
        >
          <Group gap="sm" mb="xs">
            <ThemeIcon size="lg" radius="md" color="blue" variant="light">
              <IconQrcode size={24} />
            </ThemeIcon>
            <Title order={4}>Pages d'info / QR codes</Title>
          </Group>
          <Text c="dimmed" fz="sm">
            Créer des pages d'information et générer des QR codes pour les afficher.
          </Text>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
