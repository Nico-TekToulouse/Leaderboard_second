import type { FactionName } from "@/lib/theme";

export type PlannedActivityScore = {
  factionId: string;
  factionName: string;
  factionColor: FactionName;
  points: number;
};

export type PlannedActivity = {
  id: string;
  /** Titre réel ou placeholder "Activité mystère" si non révélé (masquage server-side) */
  name: string;
  /** null si non révélé */
  description: string | null;
  /** ISO "YYYY-MM-DD" — toujours visible */
  date: string;
  maxPoints: number;
  revealed: boolean;
  /** Révélé mais date encore à venir → flouter uniquement la description */
  isUpcoming: boolean;
  /** Vide tant que l'activité n'a pas de scores attribués */
  scores: PlannedActivityScore[];
};
