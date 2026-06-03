import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { PaginatedUsers, UserInsert } from "@/types/user";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));
  const search = searchParams.get("search") ?? "";

  const supabase = createAdminClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("users")
    .select("*, faction:factions(id, name, color)", { count: "exact" })
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .range(from, to);

  if (search.trim()) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result: PaginatedUsers = {
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  };

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as UserInsert;

  if (!body.first_name || !body.last_name || !body.email) {
    return NextResponse.json(
      { error: "Les champs prénom, nom et email sont requis." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .insert({
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      email: body.email.trim().toLowerCase(),
      faction_id: body.faction_id ?? null,
    })
    .select("*, faction:factions(id, name, color)")
    .single();

  if (error) {
    console.error("[POST /api/admin/users] Supabase error:", JSON.stringify(error));
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
