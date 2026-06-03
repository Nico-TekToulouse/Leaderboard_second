import { createServerClient } from "@/lib/supabase-server";
import UsersClient from "@/components/admin/users/UsersClient";

export default async function AdminUsersPage() {
  const supabase = createServerClient();
  const { data: factions } = await supabase
    .from("factions")
    .select("id, name, color")
    .order("name");

  return <UsersClient factions={factions ?? []} />;
}
