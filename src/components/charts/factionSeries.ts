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

/**
 * Construit les séries de graphique avec les couleurs réelles de la BDD.
 * Chaque faction est identifiée par sa clé interne (color: FactionName) et sa couleur hex réelle.
 */
export function buildFactionSeries(
  factions: ReadonlyArray<{ color: FactionName; hexColor: string }>,
): FactionSeries[] {
  return FACTION_SERIES.map((s) => {
    const match = factions.find((f) => f.color === s.key);
    return { key: s.key, color: match?.hexColor ?? s.color };
  });
}
