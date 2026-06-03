import { createServerClient } from "@/lib/supabase-server";

export type FactionMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type DbUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  faction_id: string | null;
};

export async function fetchMembersByFaction(factionId: string): Promise<FactionMember[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, faction_id")
    .eq("faction_id", factionId)
    .order("last_name");

  if (error) {
    console.error("Supabase users fetch error:", error);
    return [];
  }

  return ((data ?? []) as DbUser[]).map((u) => ({
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
  }));
}

export type FactionWithMembers = {
  id: string;
  name: string;
  color: string;
  members: FactionMember[];
};

export async function fetchAllFactionsWithMembers(): Promise<FactionWithMembers[]> {
  const supabase = createServerClient();

  const [{ data: factions, error: fError }, { data: users, error: uError }] =
    await Promise.all([
      supabase.from("factions").select("id, name, color").order("name"),
      supabase
        .from("users")
        .select("id, first_name, last_name, email, faction_id")
        .order("last_name"),
    ]);

  if (fError || uError) {
    console.error("Supabase fetch error:", fError ?? uError);
    return [];
  }

  const membersByFaction = ((users ?? []) as DbUser[]).reduce<
    Record<string, FactionMember[]>
  >((acc, u) => {
    if (!u.faction_id) return acc;
    const list = acc[u.faction_id] ?? [];
    list.push({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
    });
    acc[u.faction_id] = list;
    return acc;
  }, {});

  return ((factions ?? []) as { id: string; name: string; color: string }[]).map(
    (f) => ({
      id: f.id,
      name: f.name,
      color: f.color,
      members: membersByFaction[f.id] ?? [],
    })
  );
}
