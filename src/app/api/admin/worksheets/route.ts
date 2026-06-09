import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { WorksheetInsert } from "@/types/worksheet";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("worksheets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as WorksheetInsert;

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (body.is_active) {
    await supabase
      .from("worksheets")
      .update({ is_active: false })
      .eq("is_active", true);
  }

  const { data, error } = await supabase
    .from("worksheets")
    .insert({
      title: body.title.trim(),
      description: body.description?.trim() || null,
      is_active: body.is_active ?? false,
      sections: body.sections ?? [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
