import { createServerClient } from "@/lib/supabase-server";
import type { WorksheetMember } from "@/types/worksheet";

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

/** Récupère tous les membres inscrits (ayant une faction) pour l'autocomplétion du worksheet */
export async function fetchAllMembers(): Promise<WorksheetMember[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, faction_id")
    .not("faction_id", "is", null)
    .order("last_name");

  if (error) {
    console.error("Supabase members fetch error:", error);
    return [];
  }

  return ((data ?? []) as DbUser[])
    .filter((u): u is DbUser & { faction_id: string } => u.faction_id !== null)
    .map((u) => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      factionId: u.faction_id,
    }));
}

export type FactionWithMembers = {
  id: string;
  name: string;
  color: string;
  logo: string | null;
  members: FactionMember[];
};

export async function fetchAllFactionsWithMembers(): Promise<FactionWithMembers[]> {
  const supabase = createServerClient();

  const [{ data: factions, error: fError }, { data: users, error: uError }] =
    await Promise.all([
      supabase.from("factions").select("id, name, color, logo").order("name"),
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

  return ((factions ?? []) as { id: string; name: string; color: string; logo: string | null }[]).map(
    (f) => ({
      id: f.id,
      name: f.name,
      color: f.color,
      logo: f.logo ?? null,
      members: membersByFaction[f.id] ?? [],
    })
  );
}
