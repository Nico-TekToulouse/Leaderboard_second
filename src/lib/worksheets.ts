import { createServerClient } from "@/lib/supabase-server";
import type { Worksheet } from "@/types/worksheet";

export async function fetchActiveWorksheet(): Promise<Worksheet | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("worksheets")
    .select("*")
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  return data as Worksheet;
}

export async function fetchAllWorksheets(): Promise<Worksheet[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("worksheets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data as Worksheet[]) ?? [];
}
