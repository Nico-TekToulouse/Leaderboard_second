-- ============================================================
-- LeaderBoard Epitech — Schéma initial
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE factions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL,
  logo       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  date        DATE NOT NULL,
  max_points  INTEGER NOT NULL DEFAULT 100,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faction_id  UUID NOT NULL REFERENCES factions(id)   ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  points      INTEGER NOT NULL CHECK (points >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (faction_id, activity_id)
);

CREATE TABLE planning (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day           DATE NOT NULL,
  time          TIME NOT NULL,
  activity_name TEXT NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE resources (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  url        TEXT NOT NULL,
  type       TEXT NOT NULL,  -- 'link' | 'document' | 'video'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX idx_scores_faction_id  ON scores (faction_id);
CREATE INDEX idx_scores_activity_id ON scores (activity_id);
CREATE INDEX idx_planning_day       ON planning (day);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE factions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning   ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources  ENABLE ROW LEVEL SECURITY;

-- Lecture publique (visiteurs non authentifiés)
CREATE POLICY "public read factions"   ON factions   FOR SELECT USING (true);
CREATE POLICY "public read activities" ON activities FOR SELECT USING (true);
CREATE POLICY "public read scores"     ON scores     FOR SELECT USING (true);
CREATE POLICY "public read planning"   ON planning   FOR SELECT USING (true);
CREATE POLICY "public read resources"  ON resources  FOR SELECT USING (true);

-- Écriture réservée aux utilisateurs authentifiés (admins)
CREATE POLICY "admin write factions"   ON factions   FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin write activities" ON activities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin write scores"     ON scores     FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin write planning"   ON planning   FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin write resources"  ON resources  FOR ALL USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- REALTIME
-- ────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE scores;
ALTER PUBLICATION supabase_realtime ADD TABLE factions;

-- ────────────────────────────────────────────────────────────
-- SEED — 4 factions initiales
-- ────────────────────────────────────────────────────────────

INSERT INTO factions (name, color, logo) VALUES
  ('Bats',    '#EF4444', NULL),
  ('Tigers',  '#22C55E', NULL),
  ('Turtles', '#3B82F6', NULL),
  ('Owls',    '#A855F7', NULL);
