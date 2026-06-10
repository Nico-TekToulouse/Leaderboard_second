import { createTheme, type MantineThemeOverride } from "@mantine/core";

export const EPITECH_TOKENS = {
  brandBlue: "#0000FF",
  danger: "#E85D24",
  success: "#00C853",
  accentMagenta: "#FF00FF",
  textPrimary: "#1A1A1A",
  textSecondary: "#666666",
  cardSurface: "#FFFFFF",
  pageBg: "#F0F0F0",
} as const;

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
  primaryShade: { light: 5, dark: 3 },
  colors: {
    blue: [
      "#E6E6FF",
      "#CCCCFF",
      "#9999FF",
      "#6666FF",
      "#3333FF",
      EPITECH_TOKENS.brandBlue,
      EPITECH_TOKENS.brandBlue,
      "#0000CC",
      "#000099",
      "#000066",
    ],
  },
  fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace",
  fontFamilyMonospace: "var(--font-geist-mono), 'JetBrains Mono', monospace",
  defaultRadius: 4,
  white: EPITECH_TOKENS.cardSurface,
  black: EPITECH_TOKENS.textPrimary,
  components: {
    AppShell: {
      defaultProps: {
        padding: "md",
      },
    },
    Paper: {
      defaultProps: {
        shadow: "none",
        radius: 4,
      },
    },
    NavLink: {
      styles: {
        root: {
          borderRadius: 4,
        },
      },
    },
  },
});
