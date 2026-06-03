-- ============================================================
-- LeaderBoard Epitech — Table users (élèves)
-- ============================================================

CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  faction_id UUID REFERENCES factions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_faction_id ON users (faction_id);
CREATE INDEX idx_users_email      ON users (email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "public read users" ON users FOR SELECT USING (true);

-- Écriture réservée aux admins authentifiés
CREATE POLICY "admin write users" ON users FOR ALL USING (auth.role() = 'authenticated');
