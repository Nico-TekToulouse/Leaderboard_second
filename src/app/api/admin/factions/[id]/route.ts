import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type FactionPatchBody = {
  name?: string;
  logo?: string | null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as FactionPatchBody;

  const name = body.name?.trim();
  if (name !== undefined && !name) {
    return NextResponse.json({ error: "Le nom ne peut pas être vide." }, { status: 400 });
  }

  const update: Record<string, string | null> = {};
  if (name !== undefined) update.name = name;
  if ("logo" in body) update.logo = body.logo ?? null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Aucune modification fournie." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("factions")
    .update(update)
    .eq("id", id)
    .select("id, name, color, logo")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
