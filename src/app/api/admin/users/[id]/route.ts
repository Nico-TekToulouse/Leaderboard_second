import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserUpdate } from "@/types/user";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as UserUpdate;

  if (!body.first_name && !body.last_name && !body.email && body.faction_id === undefined) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour." }, { status: 400 });
  }

  const update: UserUpdate = {};
  if (body.first_name) update.first_name = body.first_name.trim();
  if (body.last_name) update.last_name = body.last_name.trim();
  if (body.email) update.email = body.email.trim().toLowerCase();
  if (body.faction_id !== undefined) update.faction_id = body.faction_id;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .update(update)
    .eq("id", id)
    .select("*, faction:factions(id, name, color)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà." },
        { status: 409 }
      );
    }
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const supabase = createAdminClient();
  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
