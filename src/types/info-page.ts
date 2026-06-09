export type InfoPage = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export type InfoPageInsert = Omit<InfoPage, "id" | "created_at">;
export type InfoPageUpdate = Partial<InfoPageInsert>;
