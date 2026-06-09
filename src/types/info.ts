export type InfoCategory = "rules" | "sanctions" | "discord";

export type InfoEntry = {
  id: string;
  category: InfoCategory;
  title: string;
  content: string;
  url: string | null;
  order: number;
  created_at: string;
};

export type InfoEntryInsert = Omit<InfoEntry, "id" | "created_at">;
export type InfoEntryUpdate = Partial<InfoEntryInsert>;
