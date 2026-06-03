import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type {
  ImportRow,
  ImportApiResult,
  DuplicateConflict,
  DuplicateResolution,
} from "@/types/user";

type ImportRequestBody = {
  rows: ImportRow[];
  resolutions?: DuplicateResolution[];
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ImportRequestBody;
  const { rows, resolutions = [] } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Aucune donnée à importer." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const emails = rows.map((r) => r.email.toLowerCase());

  // Fetch all existing users matching any of the incoming emails
  const { data: existingUsers, error: fetchError } = await supabase
    .from("users")
    .select("*, faction:factions(id, name, color)")
    .in("email", emails);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const existingByEmail = new Map(
    (existingUsers ?? []).map((u) => [u.email, u])
  );

  const resolutionMap = new Map(
    resolutions.map((r) => [r.email.toLowerCase(), r.action])
  );

  const toInsert: ImportRow[] = [];
  const toUpdate: ImportRow[] = [];
  const duplicates: DuplicateConflict[] = [];

  for (const row of rows) {
    const emailLower = row.email.toLowerCase();
    const existing = existingByEmail.get(emailLower);

    if (!existing) {
      toInsert.push(row);
      continue;
    }

    const resolution = resolutionMap.get(emailLower);
    if (resolution === "replace") {
      toUpdate.push(row);
    } else if (resolution === "ignore") {
      // skip silently
    } else {
      // No resolution provided yet — return as conflict
      duplicates.push({ incoming: row, existing });
    }
  }

  // If there are unresolved duplicates, return them for the client to resolve
  if (duplicates.length > 0) {
    const result: ImportApiResult = {
      inserted: 0,
      duplicates,
    };
    return NextResponse.json(result, { status: 200 });
  }

  // Insert new users
  let inserted = 0;
  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("users").insert(
      toInsert.map((r) => ({
        first_name: r.first_name.trim(),
        last_name: r.last_name.trim(),
        email: r.email.trim().toLowerCase(),
        faction_id: r.faction_id ?? null,
      }))
    );
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    inserted += toInsert.length;
  }

  // Update replaced users
  for (const row of toUpdate) {
    const { error: updateError } = await supabase
      .from("users")
      .update({
        first_name: row.first_name.trim(),
        last_name: row.last_name.trim(),
        faction_id: row.faction_id ?? null,
      })
      .eq("email", row.email.toLowerCase());

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    inserted += 1;
  }

  const result: ImportApiResult = { inserted, duplicates: [] };
  return NextResponse.json(result, { status: 200 });
}
