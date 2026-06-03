import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BUCKET = "faction-logos";
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 Mo

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
};

type FactionLogoRow = {
  id: string;
  name: string;
  color: string;
  logo: string | null;
};

type LogoUploadError = { error: string };

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Extrait le chemin relatif dans le bucket à partir d'une URL publique Storage. */
function extractStoragePath(url: string): string | null {
  try {
    const parsed = new URL(url);
    // L'URL publique a la forme : .../storage/v1/object/public/<bucket>/<path>
    const marker = `/object/public/${BUCKET}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    return parsed.pathname.slice(idx + marker.length);
  } catch {
    return null;
  }
}

/** POST /api/admin/factions/[id]/logo — Upload une image comme logo de faction. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json<LogoUploadError>(
      { error: "Corps de requête invalide (FormData attendu)." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json<LogoUploadError>(
      { error: "Champ « file » manquant ou invalide." },
      { status: 400 }
    );
  }

  const ext = MIME_TO_EXT[file.type];
  if (!ext) {
    return NextResponse.json<LogoUploadError>(
      {
        error: `Type MIME non supporté : ${file.type}. Formats acceptés : PNG, JPEG, WebP, SVG, GIF.`,
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json<LogoUploadError>(
      { error: "L'image dépasse la taille maximale autorisée (2 Mo)." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Lire la faction pour récupérer l'ancien logo (pour suppression best-effort)
  const { data: existing, error: fetchError } = await supabase
    .from("factions")
    .select("id, name, color, logo")
    .eq("id", id)
    .single<FactionLogoRow>();

  if (fetchError || !existing) {
    return NextResponse.json<LogoUploadError>(
      { error: "Faction introuvable." },
      { status: 404 }
    );
  }

  // Construire un chemin unique pour invalider le cache CDN
  const storagePath = `${id}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json<LogoUploadError>(
      { error: `Erreur lors de l'upload : ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: publicData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  const publicUrl = publicData.publicUrl;

  // Mettre à jour la faction
  const { data: updated, error: updateError } = await supabase
    .from("factions")
    .update({ logo: publicUrl })
    .eq("id", id)
    .select("id, name, color, logo")
    .single<FactionLogoRow>();

  if (updateError || !updated) {
    return NextResponse.json<LogoUploadError>(
      { error: "Logo uploadé mais mise à jour BDD échouée." },
      { status: 500 }
    );
  }

  // Supprimer l'ancien fichier du bucket (best-effort, ne bloque pas)
  if (existing.logo) {
    const oldPath = extractStoragePath(existing.logo);
    if (oldPath && oldPath !== storagePath) {
      await supabase.storage.from(BUCKET).remove([oldPath]);
    }
  }

  return NextResponse.json<FactionLogoRow>(updated);
}

/** DELETE /api/admin/factions/[id]/logo — Retire le logo d'une faction. */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const supabase = createAdminClient();

  // Lire l'ancien logo pour pouvoir supprimer le fichier du bucket
  const { data: existing, error: fetchError } = await supabase
    .from("factions")
    .select("id, name, color, logo")
    .eq("id", id)
    .single<FactionLogoRow>();

  if (fetchError || !existing) {
    return NextResponse.json<LogoUploadError>(
      { error: "Faction introuvable." },
      { status: 404 }
    );
  }

  // Supprimer le fichier du bucket (best-effort)
  if (existing.logo) {
    const oldPath = extractStoragePath(existing.logo);
    if (oldPath) {
      await supabase.storage.from(BUCKET).remove([oldPath]);
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("factions")
    .update({ logo: null })
    .eq("id", id)
    .select("id, name, color, logo")
    .single<FactionLogoRow>();

  if (updateError || !updated) {
    return NextResponse.json<LogoUploadError>(
      { error: "Erreur lors de la suppression du logo." },
      { status: 500 }
    );
  }

  return NextResponse.json<FactionLogoRow>(updated);
}
