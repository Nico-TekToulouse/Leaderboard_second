import { createServerClient } from "@/lib/supabase-server";
import FactionsClient from "@/components/admin/factions/FactionsClient";
import type { FactionAdminRow } from "@/components/admin/factions/FactionEditModal";

type DbFactionRow = {
  id: string;
  name: string;
  color: string;
  logo: string | null;
};

export default async function AdminFactionsPage() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("factions")
    .select("id, name, color, logo")
    .order("name");

  const factions: FactionAdminRow[] = ((data ?? []) as DbFactionRow[]).map((f) => ({
    id: f.id,
    name: f.name,
    color: f.color,
    logo: f.logo,
  }));

  return <FactionsClient initialFactions={factions} />;
}
