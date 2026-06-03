import type { FactionName } from "@/lib/theme";

export type FactionSeriesKey = FactionName;

export type FactionSeries = {
  key: FactionSeriesKey;
  color: string;
};

/** Couleurs hex stables par clé interne de faction — ordonnées fire/water/earth/air. */
export const FACTION_SERIES: FactionSeries[] = [
  { key: "fire",  color: "#E53935" },
  { key: "water", color: "#1E88E5" },
  { key: "earth", color: "#43A047" },
  { key: "air",   color: "#8E24AA" },
];

/** Métadonnées d'affichage d'une faction (label BDD + logo optionnel). */
export type FactionMeta = {
  label: string;
  logo: string | null;
};

/** Map clé interne → métadonnées, construite depuis les FactionRow côté serveur. */
export type FactionMetaMap = Record<FactionSeriesKey, FactionMeta>;
