import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ActivityUpdate } from "@/types/activity";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("activities")
    .select("*, scores(faction_id, points, faction:factions(id, name, color))")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Epitech Race introuvable." }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as ActivityUpdate;

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Le nom de l'Epitech Race est requis." }, { status: 400 });
  }
  if (!body.date) {
    return NextResponse.json({ error: "La date est requise." }, { status: 400 });
  }
  if (typeof body.max_points !== "number" || body.max_points < 0) {
    return NextResponse.json({ error: "Le nombre de points max est invalide." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error: updateError } = await supabase
    .from("activities")
    .update({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      date: body.date,
      max_points: body.max_points,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Replace all scores: delete existing then insert new ones
  const { error: deleteError } = await supabase.from("scores").delete().eq("activity_id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des scores : " + deleteError.message },
      { status: 500 }
    );
  }

  if (body.scores && body.scores.length > 0) {
    const scoreRows = body.scores.map((s) => ({
      activity_id: id,
      faction_id: s.faction_id,
      points: s.points,
    }));

    const { error: scoresError } = await supabase.from("scores").insert(scoreRows);

    if (scoresError) {
      return NextResponse.json(
        { error: "Erreur lors de l'attribution des points : " + scoresError.message },
        { status: 500 }
      );
    }
  }

  const { data: full, error: fetchError } = await supabase
    .from("activities")
    .select("*, scores(faction_id, points, faction:factions(id, name, color))")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json(full);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = createAdminClient();

  // Delete scores first (cascade may handle this but explicit is safer)
  await supabase.from("scores").delete().eq("activity_id", id);

  const { error } = await supabase.from("activities").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
