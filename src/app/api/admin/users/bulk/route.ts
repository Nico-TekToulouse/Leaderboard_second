import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { BulkUsersPayload, BulkUsersResult } from "@/types/user";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as BulkUsersPayload;

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json(
      { error: "Le champ « ids » doit être un tableau non vide." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  if (body.action === "delete") {
    const { error } = await supabase.from("users").delete().in("id", body.ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result: BulkUsersResult = { affected: body.ids.length };
    return NextResponse.json(result);
  }

  if (body.action === "reassign") {
    const faction_id = body.faction_id ?? null;

    const { error } = await supabase
      .from("users")
      .update({ faction_id })
      .in("id", body.ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result: BulkUsersResult = { affected: body.ids.length };
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Action non reconnue." }, { status: 400 });
}
