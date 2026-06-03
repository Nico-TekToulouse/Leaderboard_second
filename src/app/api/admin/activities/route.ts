import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ActivityInsert, PaginatedActivities } from "@/types/activity";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

  const supabase = createAdminClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("activities")
    .select(
      "*, scores(faction_id, points, faction:factions(id, name, color))",
      { count: "exact" }
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result: PaginatedActivities = {
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  };

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ActivityInsert;

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Le nom de l'activité est requis." }, { status: 400 });
  }
  if (!body.date) {
    return NextResponse.json({ error: "La date est requise." }, { status: 400 });
  }
  if (typeof body.max_points !== "number" || body.max_points < 0) {
    return NextResponse.json({ error: "Le nombre de points max est invalide." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .insert({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      date: body.date,
      max_points: body.max_points,
    })
    .select("id")
    .single();

  if (activityError || !activity) {
    return NextResponse.json(
      { error: activityError?.message ?? "Erreur lors de la création de l'activité." },
      { status: 500 }
    );
  }

  if (body.scores && body.scores.length > 0) {
    const scoreRows = body.scores.map((s) => ({
      activity_id: activity.id,
      faction_id: s.faction_id,
      points: s.points,
    }));

    const { error: scoresError } = await supabase.from("scores").insert(scoreRows);

    if (scoresError) {
      // Rollback: delete the activity
      await supabase.from("activities").delete().eq("id", activity.id);
      return NextResponse.json(
        { error: "Erreur lors de l'attribution des points : " + scoresError.message },
        { status: 500 }
      );
    }
  }

  const { data: full, error: fetchError } = await supabase
    .from("activities")
    .select("*, scores(faction_id, points, faction:factions(id, name, color))")
    .eq("id", activity.id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json(full, { status: 201 });
}
