"use client";

import {
  ActionIcon,
  Menu,
  MenuTarget,
  MenuDropdown,
  MenuItem,
  useMantineColorScheme,
  type MantineColorScheme,
} from "@mantine/core";
import {
  IconSun,
  IconMoon,
  IconDeviceDesktop,
} from "@tabler/icons-react";
import type { ReactNode } from "react";

type ColorSchemeOption = {
  value: MantineColorScheme;
  label: string;
  icon: ReactNode;
};

const SCHEME_OPTIONS: ColorSchemeOption[] = [
  { value: "light", label: "Clair", icon: <IconSun size={16} /> },
  { value: "dark", label: "Sombre", icon: <IconMoon size={16} /> },
  { value: "auto", label: "Auto", icon: <IconDeviceDesktop size={16} /> },
];

export default function ColorSchemeToggle(): ReactNode {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Menu shadow="md" width={140} position="bottom-end">
      <MenuTarget>
        <ActionIcon
          variant="default"
          size="lg"
          aria-label="Changer le thème"
        >
          <IconSun size={18} className="mantine-dark-hidden" />
          <IconMoon size={18} className="mantine-light-hidden" />
        </ActionIcon>
      </MenuTarget>
      <MenuDropdown>
        {SCHEME_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            leftSection={option.icon}
            onClick={() => setColorScheme(option.value)}
            fw={colorScheme === option.value ? 700 : 400}
          >
            {option.label}
          </MenuItem>
        ))}
      </MenuDropdown>
    </Menu>
  );
}
