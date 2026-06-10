"use client";

import {
  AppShell,
  AppShellHeader,
  AppShellNavbar,
  AppShellMain,
  AppShellSection,
  Burger,
  Group,
  NavLink,
  Text,
  Avatar,
  Box,
  ScrollArea,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconTrophy,
  IconUsers,
  IconCalendar,
  IconLink,
  IconSettings,
  IconClipboardList,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Leaderboard", href: "/", icon: <IconTrophy size={18} /> },
  { label: "Factions", href: "/faction", icon: <IconUsers size={18} /> },
  { label: "Planning", href: "/planning", icon: <IconCalendar size={18} /> },
  { label: "Activité", href: "/activite", icon: <IconClipboardList size={18} /> },
  {
    label: "Informations utiles",
    href: "/links",
    icon: <IconLink size={18} />,
  },
  { label: "Admin", href: "/admin", icon: <IconSettings size={18} /> },
];

type AppShellLayoutProps = {
  children: ReactNode;
};

export default function AppShellLayout({ children }: AppShellLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 220, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShellHeader>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Text fw={800} fz="xl" c="blue.5" style={{ letterSpacing: -0.5 }}>
              {"{ EPITECH }"}
            </Text>
          </Group>
          <Title order={4} fw={500} c="dimmed" visibleFrom="sm">
            Leaderboard des factions — Stage de seconde
          </Title>
          <Group gap="xs">
            <Avatar color="blue" radius="xl" size="sm">
              E
            </Avatar>
          </Group>
        </Group>
      </AppShellHeader>

      <AppShellNavbar p="md">
        <AppShellSection>
          <Text fz="xs" fw={700} c="blue.5" mb="xs" tt="uppercase">
            Navigation
          </Text>
        </AppShellSection>

        <AppShellSection grow component={ScrollArea}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              component={Link}
              href={item.href}
              label={item.label}
              leftSection={item.icon}
              active={
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href)
              }
              variant="filled"
              mb={4}
            />
          ))}
        </AppShellSection>

        <AppShellSection>
          <Box
            pt="md"
            style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
          >
            <Text fz="xs" c="dimmed" ta="center">
              Epitech - 2026
            </Text>
          </Box>
        </AppShellSection>
      </AppShellNavbar>

      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
