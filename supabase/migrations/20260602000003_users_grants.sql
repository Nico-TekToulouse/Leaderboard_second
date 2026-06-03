-- Grant privileges on the users table to the authenticated role
-- (must run after 20260602000002_users.sql which creates the table)

GRANT SELECT ON users TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON users TO authenticated;
