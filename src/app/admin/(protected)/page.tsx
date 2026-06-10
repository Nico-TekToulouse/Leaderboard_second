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
import {
  IconUsers,
  IconSettings,
  IconTrophy,
  IconShield,
  IconQrcode,
  IconInfoCircle,
  IconClipboardList,
} from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AdminDashboardCard = {
  title: string;
  href: string;
  description: string;
  icon: ReactNode;
  color: string;
};

const ADMIN_DASHBOARD_CARDS: AdminDashboardCard[] = [
  {
    title: "Utilisateurs",
    href: "/admin/users",
    description: "Gérer les 120 élèves, leurs factions et importer des listes.",
    icon: <IconUsers size={24} />,
    color: "blue",
  },
  {
    title: "Epitech Race",
    href: "/admin/activities",
    description: "Ajouter des Epitech Race et attribuer des points aux factions.",
    icon: <IconTrophy size={24} />,
    color: "orange",
  },
  {
    title: "Factions",
    href: "/admin/factions",
    description: "Renommer les factions et mettre à jour leur logo.",
    icon: <IconShield size={24} />,
    color: "violet",
  },
  {
    title: "Informations",
    href: "/admin/info",
    description: "Gérer le règlement, les sanctions et les liens Discord.",
    icon: <IconInfoCircle size={24} />,
    color: "blue",
  },
  {
    title: "Worksheets",
    href: "/admin/worksheets",
    description: "Créer des activités interactives pour les stagiaires.",
    icon: <IconClipboardList size={24} />,
    color: "violet",
  },
  {
    title: "QR Codes",
    href: "/admin/info-pages",
    description: "Créer des pages d'information et générer des QR codes pour les afficher.",
    icon: <IconQrcode size={24} />,
    color: "blue",
  },
];

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
        {ADMIN_DASHBOARD_CARDS.map((card) => (
          <Paper
            key={card.href}
            component={Link}
            href={card.href}
            p="lg"
            withBorder
            style={{ textDecoration: "none", cursor: "pointer" }}
          >
            <Group gap="sm" mb="xs">
              <ThemeIcon size="lg" radius="md" color={card.color} variant="light">
                {card.icon}
              </ThemeIcon>
              <Title order={4}>{card.title}</Title>
            </Group>
            <Text c="dimmed" fz="sm">
              {card.description}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
