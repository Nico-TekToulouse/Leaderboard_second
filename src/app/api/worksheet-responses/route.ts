import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { WorksheetResponseInsert } from "@/types/worksheet";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as WorksheetResponseInsert;

  if (!body.worksheet_id) {
    return NextResponse.json({ error: "worksheet_id requis." }, { status: 400 });
  }
  if (!body.faction_id) {
    return NextResponse.json({ error: "faction_id requis." }, { status: 400 });
  }
  if (!body.respondent_firstname?.trim()) {
    return NextResponse.json({ error: "Le prénom est requis." }, { status: 400 });
  }
  if (!body.respondent_lastname?.trim()) {
    return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: ws, error: wsError } = await supabase
    .from("worksheets")
    .select("id, is_active")
    .eq("id", body.worksheet_id)
    .single();

  if (wsError || !ws || !(ws as { is_active: boolean }).is_active) {
    return NextResponse.json(
      { error: "Ce worksheet n'est pas actif ou n'existe pas." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("worksheet_responses")
    .insert({
      worksheet_id: body.worksheet_id,
      faction_id: body.faction_id,
      respondent_firstname: body.respondent_firstname.trim(),
      respondent_lastname: body.respondent_lastname.trim(),
      answers: body.answers ?? {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
