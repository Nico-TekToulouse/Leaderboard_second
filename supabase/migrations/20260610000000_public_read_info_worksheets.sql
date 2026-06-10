-- ============================================================
-- Fix : activer RLS + policy de lecture publique sur les tables
-- info_pages, info_entries et worksheets.
-- Ces tables avaient un GRANT SELECT TO anon mais aucun
-- ENABLE ROW LEVEL SECURITY ni policy de lecture, ce qui
-- bloquait le rôle anon (visiteur) tout en laissant le rôle
-- service_role (admin) voir toutes les lignes.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- info_pages
-- ────────────────────────────────────────────────────────────
ALTER TABLE info_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read info_pages"  ON info_pages;
DROP POLICY IF EXISTS "admin write info_pages"  ON info_pages;

CREATE POLICY "public read info_pages"
  ON info_pages FOR SELECT USING (true);

CREATE POLICY "admin write info_pages"
  ON info_pages FOR ALL USING (auth.role() = 'authenticated');

GRANT SELECT ON info_pages TO anon, authenticated;

-- ────────────────────────────────────────────────────────────
-- info_entries
-- ────────────────────────────────────────────────────────────
ALTER TABLE info_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read info_entries" ON info_entries;
DROP POLICY IF EXISTS "admin write info_entries" ON info_entries;

CREATE POLICY "public read info_entries"
  ON info_entries FOR SELECT USING (true);

CREATE POLICY "admin write info_entries"
  ON info_entries FOR ALL USING (auth.role() = 'authenticated');

GRANT SELECT ON info_entries TO anon, authenticated;

-- ────────────────────────────────────────────────────────────
-- worksheets
-- ────────────────────────────────────────────────────────────
ALTER TABLE worksheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read worksheets" ON worksheets;
DROP POLICY IF EXISTS "admin write worksheets" ON worksheets;

CREATE POLICY "public read worksheets"
  ON worksheets FOR SELECT USING (true);

CREATE POLICY "admin write worksheets"
  ON worksheets FOR ALL USING (auth.role() = 'authenticated');

GRANT SELECT ON worksheets TO anon, authenticated;
