-- Grant full access to service_role on all tables
-- (service_role is used by the admin API client and should bypass all restrictions)

GRANT ALL ON factions   TO service_role;
GRANT ALL ON activities TO service_role;
GRANT ALL ON scores     TO service_role;
GRANT ALL ON planning   TO service_role;
GRANT ALL ON resources  TO service_role;
GRANT ALL ON users      TO service_role;
