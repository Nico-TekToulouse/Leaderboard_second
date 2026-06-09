"use client";

import {
  AppShell,
  AppShellHeader,
  AppShellNavbar,
  AppShellMain,
  AppShellSection,
  Button,
  Group,
  NavLink,
  Text,
  ScrollArea,
  Box,
  Avatar,
  Stack,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSettings,
  IconUsers,
  IconLogout,
  IconArrowLeft,
  IconChevronRight,
  IconTrophy,
  IconShield,
  IconInfoCircle,
  IconClipboardList,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, type ReactNode } from "react";

type AdminNavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <IconSettings size={18} /> },
  {
    label: "Utilisateurs",
    href: "/admin/users",
    icon: <IconUsers size={18} />,
  },
  {
    label: "Epitech Race",
    href: "/admin/activities",
    icon: <IconTrophy size={18} />,
  },
  {
    label: "Factions",
    href: "/admin/factions",
    icon: <IconShield size={18} />,
  },
  {
    label: "Informations",
    href: "/admin/info",
    icon: <IconInfoCircle size={18} />,
  },
  {
    label: "Worksheets",
    href: "/admin/worksheets",
    icon: <IconClipboardList size={18} />,
  },
];

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAdminEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  function getInitial(email: string | null): string {
    return email ? email.charAt(0).toUpperCase() : "A";
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: true } }}
      padding="md"
    >
      <AppShellHeader>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Text fw={800} fz="xl" c="blue.6" style={{ letterSpacing: -0.5 }}>
              {"{ EPITECH }"}
            </Text>
            <Text fz="xs" c="dimmed" fw={500} visibleFrom="sm">
              / Admin
            </Text>
          </Group>

          <Group gap="sm">
            {adminEmail && (
              <Group gap="xs" visibleFrom="sm">
                <Avatar size="sm" radius="xl" color="blue" variant="filled">
                  {getInitial(adminEmail)}
                </Avatar>
                <Text fz="sm" c="dimmed" visibleFrom="md">
                  {adminEmail}
                </Text>
              </Group>
            )}
            <Button
              variant="subtle"
              color="red"
              size="xs"
              leftSection={<IconLogout size={14} />}
              onClick={handleLogout}
            >
              Déconnexion
            </Button>
          </Group>
        </Group>
      </AppShellHeader>

      <AppShellNavbar p={0}>
        {/* Nav header */}
        <Box p="md" pb="xs">
          <Text
            fz="xs"
            fw={700}
            c="blue.5"
            tt="uppercase"
            style={{ letterSpacing: 1 }}
          >
            Navigation
          </Text>
        </Box>

        <AppShellSection grow component={ScrollArea} px="sm">
          <Stack gap={2}>
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                component={Link}
                href={item.href}
                label={item.label}
                leftSection={item.icon}
                rightSection={<IconChevronRight size={14} />}
                active={
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href)
                }
                variant="filled"
                style={{ borderRadius: "var(--mantine-radius-md)" }}
              />
            ))}
          </Stack>
        </AppShellSection>

        {/* Footer */}
        <AppShellSection p="sm">
          <Divider mb="sm" />
          {adminEmail && (
            <Group gap="xs" mb="sm" px="xs">
              <Avatar size="sm" radius="xl" color="blue" variant="filled">
                {getInitial(adminEmail)}
              </Avatar>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text fz="xs" fw={500} truncate>
                  {adminEmail}
                </Text>
                <Text fz="xs" c="dimmed">
                  Administrateur
                </Text>
              </Box>
            </Group>
          )}
          <NavLink
            component={Link}
            href="/"
            label="Retour au site"
            leftSection={<IconArrowLeft size={16} />}
            variant="subtle"
            style={{ borderRadius: "var(--mantine-radius-md)" }}
          />
        </AppShellSection>
      </AppShellNavbar>

      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
