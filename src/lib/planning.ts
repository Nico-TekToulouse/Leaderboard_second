import { createServerClient } from "@/lib/supabase-server";
import { hexToFactionName } from "@/lib/factions";
import type { PlannedActivity, PlannedActivityScore } from "@/types/planning";
import type { FactionName } from "@/lib/theme";

type DbFactionRef = {
  id: string;
  name: string;
  color: string;
};

type DbScore = {
  faction_id: string;
  points: number;
  faction: DbFactionRef | DbFactionRef[] | null;
};

type DbActivity = {
  id: string;
  name: string;
  description: string | null;
  date: string;
  max_points: number;
  scores: DbScore[];
};

/**
 * Une activité est révélée la veille de sa date (J-1 inclus).
 * Le calcul est jour-granulaire (ignorant l'heure) et effectué côté serveur.
 */
function todayLocalStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isRevealed(dateStr: string): boolean {
  // La date de révélation = veille de l'activité (J-1)
  const revealDay = new Date(`${dateStr}T00:00:00`);
  revealDay.setDate(revealDay.getDate() - 1);
  const revealStr = `${revealDay.getFullYear()}-${String(revealDay.getMonth() + 1).padStart(2, "0")}-${String(revealDay.getDate()).padStart(2, "0")}`;
  return todayLocalStr() >= revealStr;
}

function resolveFaction(faction: DbFactionRef | DbFactionRef[] | null): DbFactionRef | null {
  if (!faction) return null;
  if (Array.isArray(faction)) return faction[0] ?? null;
  return faction;
}

/**
 * Récupère la liste complète des activités triées par date croissante.
 * Les activités non révélées ont leur nom/description masqués (pas de fuite côté client).
 */
export async function fetchPlannedActivities(): Promise<PlannedActivity[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("activities")
    .select(
      "id, name, description, date, max_points, scores(faction_id, points, faction:factions(id, name, color))"
    )
    .order("date", { ascending: true });

  if (error) {
    console.error("Supabase fetchPlannedActivities error:", error);
    return [];
  }

  return ((data ?? []) as DbActivity[]).map((activity): PlannedActivity => {
    const revealed = isRevealed(activity.date);

    const scores: PlannedActivityScore[] = revealed
      ? activity.scores
          .map((s): PlannedActivityScore | null => {
            const faction = resolveFaction(s.faction);
            if (!faction) return null;
            return {
              factionId: faction.id,
              factionName: faction.name,
              factionColor: hexToFactionName(faction.color) as FactionName,
              points: s.points,
            };
          })
          .filter((s): s is PlannedActivityScore => s !== null)
          .sort((a, b) => b.points - a.points)
      : [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const isUpcoming = revealed && activity.date > todayStr;

    return {
      id: activity.id,
      name: revealed ? activity.name : "Activité mystère",
      description: revealed ? activity.description : null,
      date: activity.date,
      maxPoints: activity.max_points,
      revealed,
      isUpcoming,
      scores,
    };
  });
}
