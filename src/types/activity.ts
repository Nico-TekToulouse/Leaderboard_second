export type Activity = {
  id: string;
  name: string;
  description: string | null;
  date: string;
  max_points: number;
  created_at: string;
};

export type FactionScore = {
  faction_id: string;
  points: number;
};

export type ActivityWithScores = Activity & {
  scores: (FactionScore & {
    faction: {
      id: string;
      name: string;
      color: string;
    };
  })[];
};

export type ScoreEntry = {
  faction_id: string;
  points: number;
};

/** Mode d'attribution des points */
export type ScoreMode = "per_faction" | "by_ranking";

/** Une ligne de scoring dans le formulaire */
export type ScoreRow = {
  faction_id: string;
  points: number | "";
};

/** Une ligne de classement dans le formulaire */
export type RankingRow = {
  faction_id: string | "";
  points: number | "";
};

export type ActivityInsert = {
  name: string;
  description: string | null;
  date: string;
  max_points: number;
  scores: ScoreEntry[];
};

export type ActivityUpdate = ActivityInsert;

export type PaginatedActivities = {
  data: ActivityWithScores[];
  total: number;
  page: number;
  pageSize: number;
};
