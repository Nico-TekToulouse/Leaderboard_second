import { createServerClient } from "@/lib/supabase-server";
import ActivitiesClient from "@/components/admin/activities/ActivitiesClient";

export default async function AdminActivitiesPage() {
  const supabase = createServerClient();
  const { data: factions } = await supabase
    .from("factions")
    .select("id, name, color")
    .order("name");

  return <ActivitiesClient factions={factions ?? []} />;
}
