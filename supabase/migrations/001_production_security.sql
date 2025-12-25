-- ========================================
-- SUPABASE DATABASE SETUP - PRODUCTION SECURITY
-- ========================================

-- Step 1: Create vote_options table
CREATE TABLE IF NOT EXISTS vote_options (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  vote_count INT4 DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create vote_logs table for rate limiting
CREATE TABLE IF NOT EXISTS vote_logs (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  option_id BIGINT REFERENCES vote_options(id) ON DELETE CASCADE,
  voted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_vote_logs_time ON vote_logs(voted_at);
CREATE INDEX IF NOT EXISTS idx_vote_logs_ip ON vote_logs(ip);
CREATE INDEX IF NOT EXISTS idx_vote_logs_fingerprint ON vote_logs(fingerprint);

-- Step 3: Create add_logs table for rate limiting
CREATE TABLE IF NOT EXISTS add_logs (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  content TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_add_logs_time ON add_logs(added_at);
CREATE INDEX IF NOT EXISTS idx_add_logs_ip ON add_logs(ip);
CREATE INDEX IF NOT EXISTS idx_add_logs_fingerprint ON add_logs(fingerprint);

-- Step 4: Enable Row Level Security
ALTER TABLE vote_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- SECURE RLS POLICIES
-- ========================================

-- vote_options: Allow public to READ only
DROP POLICY IF EXISTS "Public can view options" ON vote_options;
CREATE POLICY "Public can view options"
ON vote_options FOR SELECT
USING (true);

-- vote_options: DENY direct INSERT (must use Edge Function)
DROP POLICY IF EXISTS "Allow insert for all" ON vote_options;
-- No insert policy = only service_role (Edge Function) can insert

-- vote_options: DENY direct UPDATE (must use Edge Function)
DROP POLICY IF EXISTS "Allow update for all" ON vote_options;
-- No update policy = only service_role (Edge Function) can update

-- vote_options: DENY direct DELETE (must use Edge Function)
DROP POLICY IF EXISTS "Allow delete for all" ON vote_options;
-- No delete policy = only service_role (Edge Function) can delete

-- vote_logs: DENY all public access (only Edge Functions can write)
-- No policies = only service_role can access

-- add_logs: DENY all public access (only Edge Functions can write)
-- No policies = only service_role can access

-- ========================================
-- CLEANUP OLD LOGS (Optional - run manually or via cron)
-- ========================================

-- Delete vote logs older than 7 days
-- DELETE FROM vote_logs WHERE voted_at < NOW() - INTERVAL '7 days';

-- Delete add logs older than 7 days
-- DELETE FROM add_logs WHERE added_at < NOW() - INTERVAL '7 days';

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to increment vote count (if needed for future use)
CREATE OR REPLACE FUNCTION increment_vote_count(option_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE vote_options
  SET vote_count = vote_count + 1
  WHERE id = option_id;
END;
$$;

-- ========================================
-- NOTES
-- ========================================

/*
SECURITY IMPROVEMENTS:
1. ✅ Public can only READ vote_options
2. ✅ All INSERT/UPDATE/DELETE must go through Edge Functions
3. ✅ Edge Functions use service_role key (not exposed to client)
4. ✅ Rate limiting tables track IP + browser fingerprint
5. ✅ Indexes for fast rate limit queries
6. ✅ ON DELETE CASCADE for data integrity

DEPLOYMENT:
1. Run this SQL in Supabase SQL Editor
2. Deploy Edge Functions:
   - supabase functions deploy admin-action
   - supabase functions deploy vote-action
   - supabase functions deploy add-option
3. Set environment variables in Supabase:
   - ADMIN_PASSWORD_HASH (your admin password)
4. Update frontend to call Edge Functions instead of direct DB access

RATE LIMITS:
- Vote: 5 seconds between votes, 1 vote per option per 24 hours
- Add: 10 seconds cooldown, max 5 options per hour
- Tracked by IP + browser fingerprint

ADMIN ACTIONS:
- Protected by admin password in Edge Function
- Uses service_role key to bypass RLS
*/
