import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { InfoEntryInsert } from "@/types/info";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("info_entries")
    .select("*")
    .order("category", { ascending: true })
    .order("order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as InfoEntryInsert;

  if (!body.category || !["rules", "sanctions", "discord"].includes(body.category)) {
    return NextResponse.json({ error: "La catégorie est invalide." }, { status: 400 });
  }
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("info_entries")
    .insert({
      category: body.category,
      title: body.title.trim(),
      content: body.content?.trim() ?? "",
      url: body.url?.trim() || null,
      order: body.order ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
