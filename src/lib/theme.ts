import { createTheme, type MantineThemeOverride } from "@mantine/core";

export const FACTION_COLORS = {
  fire: "#E53935",
  water: "#1E88E5",
  earth: "#43A047",
  air: "#8E24AA",
} as const;

export type FactionName = keyof typeof FACTION_COLORS;

/** Correspondance FactionName → nom de couleur Mantine */
export const FACTION_MANTINE_COLOR: Record<FactionName, string> = {
  fire: "red",
  water: "blue",
  earth: "green",
  air: "violet",
};

export const theme: MantineThemeOverride = createTheme({
  primaryColor: "blue",
  colors: {
    blue: [
      "#E3F0FD",
      "#BAD6FB",
      "#8FBCF8",
      "#64A2F5",
      "#3E8DF2",
      "#1A73E8",
      "#1565D8",
      "#1057C8",
      "#0B4AB8",
      "#063DA8",
    ],
  },
  fontFamily: "var(--font-geist-sans), Arial, sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), monospace",
  defaultRadius: "md",
  components: {
    AppShell: {
      defaultProps: {
        padding: "md",
      },
    },
  },
});
