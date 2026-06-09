import { createServerClient } from "@/lib/supabase-server";
import WorksheetsClient from "@/components/admin/worksheets/WorksheetsClient";

type Faction = {
  id: string;
  name: string;
  color: string;
};

export default async function AdminWorksheetsPage() {
  const supabase = createServerClient();

  const { data: factions } = await supabase
    .from("factions")
    .select("id, name, color")
    .order("name");

  return <WorksheetsClient factions={(factions as Faction[]) ?? []} />;
}
