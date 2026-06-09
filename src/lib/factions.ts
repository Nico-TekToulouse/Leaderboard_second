import { createServerClient } from "@/lib/supabase-server";
import type { FactionName } from "@/lib/theme";
import { FACTION_SERIES, buildFactionSeries } from "@/components/charts/factionSeries";
import type { FactionSeries } from "@/components/charts/factionSeries";

export type ActivityScore = {
  activityId: string;
  activityName: string;
  description: string | null;
  date: string;
  points: number;
  maxPoints: number;
};

export type FactionDetail = {
  id: string;
  name: string;
  color: FactionName;
  hexColor: string;
  logo: string | null;
  totalPoints: number;
  rank: number;
  scores: ActivityScore[];
};

export type FactionRow = {
  id: string;
  name: string;
  color: FactionName;
  hexColor: string;
  totalPoints: number;
  logo: string | null;
};

export type ActivityChartPoint = {
  activity: string;
  fire: number;
  water: number;
  earth: number;
  air: number;
};

export type DayChartPoint = {
  date: string;
  fire: number;
  water: number;
  earth: number;
  air: number;
};

type DbFaction = {
  id: string;
  name: string;
  color: string;
  logo: string | null;
};

type DbScore = {
  faction_id: string;
  points: number;
};

/**
 * Maps a hex color from the DB to the nearest FactionName theme key.
 * Red → fire, Green → earth, Blue → water, Purple/Violet → air.
 */
export function hexToFactionName(hex: string): FactionName {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (r >= g && r >= b) return "fire";
  if (g >= r && g >= b) return "earth";
  if (b >= r && b >= g) {
    // Distinguish blue vs purple: purple has significant red
    if (r > 100) return "air";
    return "water";
  }
  return "fire";
}

export async function fetchFactionLeaderboard(): Promise<FactionRow[]> {
  const supabase = createServerClient();

  const [{ data: factions, error: factionsError }, { data: scores, error: scoresError }] =
    await Promise.all([
      supabase.from("factions").select("id, name, color, logo"),
      supabase.from("scores").select("faction_id, points"),
    ]);

  if (factionsError || scoresError) {
    console.error("Supabase fetch error:", factionsError ?? scoresError);
    return [];
  }

  const pointsByFaction = ((scores ?? []) as DbScore[]).reduce<Record<string, number>>(
    (acc, score) => {
      acc[score.faction_id] = (acc[score.faction_id] ?? 0) + score.points;
      return acc;
    },
    {},
  );

  return ((factions ?? []) as DbFaction[])
    .map((faction) => ({
      id: faction.id,
      name: faction.name,
      color: hexToFactionName(faction.color),
      hexColor: faction.color,
      totalPoints: pointsByFaction[faction.id] ?? 0,
      logo: faction.logo,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

type DbActivity = {
  id: string;
  name: string;
  description: string | null;
  date: string;
  max_points: number;
};

type DbScoreRaw = {
  points: number;
  activities: DbActivity | DbActivity[] | null;
};

function resolveActivity(activities: DbActivity | DbActivity[] | null): DbActivity | null {
  if (!activities) return null;
  if (Array.isArray(activities)) return activities[0] ?? null;
  return activities;
}

export async function fetchFactionDetail(id: string): Promise<FactionDetail | null> {
  const supabase = createServerClient();

  const [
    { data: faction, error: factionError },
    { data: scoresRaw, error: scoresError },
    allFactions,
  ] = await Promise.all([
    supabase.from("factions").select("id, name, color, logo").eq("id", id).single(),
    supabase
      .from("scores")
      .select("points, activities(id, name, description, date, max_points)")
      .eq("faction_id", id),
    fetchFactionLeaderboard(),
  ]);

  if (factionError || !faction) return null;
  if (scoresError) {
    console.error("Supabase scores fetch error:", scoresError);
  }

  const rank = allFactions.findIndex((f) => f.id === id) + 1;
  const totalPoints = allFactions.find((f) => f.id === id)?.totalPoints ?? 0;

  const scores: ActivityScore[] = ((scoresRaw ?? []) as DbScoreRaw[])
    .map((s) => {
      const activity = resolveActivity(s.activities);
      if (!activity) return null;
      return {
        activityId: activity.id,
        activityName: activity.name,
        description: activity.description,
        date: activity.date,
        points: s.points,
        maxPoints: activity.max_points,
      } satisfies ActivityScore;
    })
    .filter((s): s is ActivityScore => s !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    id: faction.id,
    name: faction.name,
    color: hexToFactionName(faction.color),
    hexColor: faction.color as string,
    logo: (faction.logo as string | null) ?? null,
    totalPoints,
    rank,
    scores,
  };
}

type DbScoreWithFaction = {
  faction_id: string;
  points: number;
  activities: DbActivity | DbActivity[] | null;
};

type DbFactionColor = {
  id: string;
  color: string;
};

export type ChartData = {
  byActivity: ActivityChartPoint[];
  byDay: DayChartPoint[];
  factionSeries: FactionSeries[];
};

export async function fetchAllFactionScores(): Promise<ChartData> {
  const supabase = createServerClient();

  const [{ data: scoresRaw, error: scoresError }, { data: factions, error: factionsError }] =
    await Promise.all([
      supabase
        .from("scores")
        .select("faction_id, points, activities(id, name, description, date, max_points)"),
      supabase.from("factions").select("id, color"),
    ]);

  if (scoresError || factionsError) {
    console.error("Chart data fetch error:", scoresError ?? factionsError);
    return { byActivity: [], byDay: [], factionSeries: FACTION_SERIES };
  }

  const factionColorMap = ((factions ?? []) as DbFactionColor[]).reduce<Record<string, FactionName>>(
    (acc, f) => {
      acc[f.id] = hexToFactionName(f.color);
      return acc;
    },
    {},
  );

  // Group scores by activity
  const activityMap: Record<
    string,
    { name: string; date: string; scores: Partial<Record<FactionName, number>> }
  > = {};

  for (const raw of (scoresRaw ?? []) as DbScoreWithFaction[]) {
    const activity = resolveActivity(raw.activities);
    if (!activity) continue;

    const factionColor = factionColorMap[raw.faction_id];
    if (!factionColor) continue;

    if (!activityMap[activity.id]) {
      activityMap[activity.id] = { name: activity.name, date: activity.date, scores: {} };
    }
    activityMap[activity.id].scores[factionColor] =
      (activityMap[activity.id].scores[factionColor] ?? 0) + raw.points;
  }

  const byActivity: ActivityChartPoint[] = Object.values(activityMap)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((entry) => ({
      activity: entry.name,
      fire: entry.scores.fire ?? 0,
      water: entry.scores.water ?? 0,
      earth: entry.scores.earth ?? 0,
      air: entry.scores.air ?? 0,
    }));

  // Group scores by day
  const dayMap: Record<string, Partial<Record<FactionName, number>>> = {};

  for (const raw of (scoresRaw ?? []) as DbScoreWithFaction[]) {
    const activity = resolveActivity(raw.activities);
    if (!activity) continue;

    const factionColor = factionColorMap[raw.faction_id];
    if (!factionColor) continue;

    const dayKey = activity.date; // ISO date string "YYYY-MM-DD"
    if (!dayMap[dayKey]) dayMap[dayKey] = {};
    dayMap[dayKey][factionColor] = (dayMap[dayKey][factionColor] ?? 0) + raw.points;
  }

  // Build cumulative day chart data
  const sortedDays = Object.keys(dayMap).sort();
  const cumulative: Record<FactionName, number> = { fire: 0, water: 0, earth: 0, air: 0 };

  const byDay: DayChartPoint[] = sortedDays.map((dayKey) => {
    const dayScores = dayMap[dayKey];
    cumulative.fire += dayScores.fire ?? 0;
    cumulative.water += dayScores.water ?? 0;
    cumulative.earth += dayScores.earth ?? 0;
    cumulative.air += dayScores.air ?? 0;

    const dateLabel = new Date(dayKey).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });

    return {
      date: dateLabel,
      fire: cumulative.fire,
      water: cumulative.water,
      earth: cumulative.earth,
      air: cumulative.air,
    };
  });

  const dynamicFactionSeries = buildFactionSeries(
    ((factions ?? []) as DbFactionColor[]).map((f) => ({
      color: hexToFactionName(f.color),
      hexColor: f.color,
    })),
  );

  return { byActivity, byDay, factionSeries: dynamicFactionSeries };
}
