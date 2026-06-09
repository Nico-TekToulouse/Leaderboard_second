import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { SectionResource } from "@/types/worksheet";

const BUCKET = "worksheet-resources";
const MAX_BYTES = 20 * 1024 * 1024; // 20 Mo

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)." }, { status: 413 });
  }

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const resource: SectionResource = {
    name: file.name,
    url: publicData.publicUrl,
    mime_type: file.type,
  };

  return NextResponse.json(resource, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { url } = (await request.json()) as { url: string };

  if (!url) {
    return NextResponse.json({ error: "URL manquante." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Extrait le path depuis l'URL publique (tout ce qui suit "/worksheet-resources/")
  const marker = `/worksheet-resources/`;
  const idx = url.indexOf(marker);
  if (idx === -1) {
    return NextResponse.json({ error: "URL invalide." }, { status: 400 });
  }
  const path = url.slice(idx + marker.length);

  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
