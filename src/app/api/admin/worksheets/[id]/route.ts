import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { WorksheetUpdate } from "@/types/worksheet";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as WorksheetUpdate;

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (body.is_active === true) {
    await supabase
      .from("worksheets")
      .update({ is_active: false })
      .eq("is_active", true)
      .neq("id", id);
  }

  const { data, error } = await supabase
    .from("worksheets")
    .update({
      title: body.title.trim(),
      description: body.description?.trim() || null,
      is_active: body.is_active ?? false,
      sections: body.sections ?? [],
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("worksheets").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
