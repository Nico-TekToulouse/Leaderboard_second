import { createServerClient } from "@/lib/supabase-server";
import type { InfoEntry } from "@/types/info";

export async function fetchInfoEntries(): Promise<InfoEntry[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("info_entries")
    .select("*")
    .order("order", { ascending: true });

  if (error) {
    return [];
  }

  return (data as InfoEntry[]) ?? [];
}
