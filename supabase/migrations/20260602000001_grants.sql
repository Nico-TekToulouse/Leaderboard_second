-- Grant SELECT privileges to the anon and authenticated roles
-- (required in addition to RLS policies for Supabase to allow public reads)

GRANT SELECT ON factions   TO anon, authenticated;
GRANT SELECT ON activities TO anon, authenticated;
GRANT SELECT ON scores     TO anon, authenticated;
GRANT SELECT ON planning   TO anon, authenticated;
GRANT SELECT ON resources  TO anon, authenticated;

-- Allow authenticated (admin) to write all tables
GRANT INSERT, UPDATE, DELETE ON factions   TO authenticated;
GRANT INSERT, UPDATE, DELETE ON activities TO authenticated;
GRANT INSERT, UPDATE, DELETE ON scores     TO authenticated;
GRANT INSERT, UPDATE, DELETE ON planning   TO authenticated;
GRANT INSERT, UPDATE, DELETE ON resources  TO authenticated;
