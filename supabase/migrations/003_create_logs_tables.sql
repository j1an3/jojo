-- ========================================
-- CREATE MISSING TABLES FOR EDGE FUNCTIONS
-- Copy và paste toàn bộ vào Supabase SQL Editor
-- ========================================

-- 1. Create vote_logs table
CREATE TABLE IF NOT EXISTS vote_logs (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  option_id BIGINT REFERENCES vote_options(id) ON DELETE CASCADE,
  voted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vote_logs_time ON vote_logs(voted_at);
CREATE INDEX IF NOT EXISTS idx_vote_logs_ip ON vote_logs(ip);
CREATE INDEX IF NOT EXISTS idx_vote_logs_fingerprint ON vote_logs(fingerprint);

-- 2. Create add_logs table
CREATE TABLE IF NOT EXISTS add_logs (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  content TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_add_logs_time ON add_logs(added_at);
CREATE INDEX IF NOT EXISTS idx_add_logs_ip ON add_logs(ip);
CREATE INDEX IF NOT EXISTS idx_add_logs_fingerprint ON add_logs(fingerprint);

-- 3. Enable RLS (no public access - only Edge Functions)
ALTER TABLE vote_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_logs ENABLE ROW LEVEL SECURITY;

-- No policies = only service_role (Edge Functions) can access

-- 4. Done!
SELECT 'Tables created successfully!' as status;
