import { createServerClient } from "@/lib/supabase-server";
import type { InfoPage } from "@/types/info-page";

export async function fetchInfoPages(): Promise<InfoPage[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("info_pages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchInfoPages error:", error.message);
    return [];
  }

  return data ?? [];
}

export async function fetchInfoPage(id: string): Promise<InfoPage | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("info_pages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("fetchInfoPage error:", error.message);
    return null;
  }

  return data;
}
