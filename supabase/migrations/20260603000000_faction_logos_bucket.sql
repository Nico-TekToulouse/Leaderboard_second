-- ============================================================
-- Bucket Supabase Storage pour les logos de factions
-- ============================================================

-- Création du bucket public (les URLs générées sont accessibles sans auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('faction-logos', 'faction-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique : n'importe quel visiteur peut afficher les logos
CREATE POLICY "public read faction logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'faction-logos');

-- L'écriture (upload/suppression) est effectuée uniquement par la service role
-- via les route handlers Next.js — pas besoin de policy INSERT/DELETE ici.
