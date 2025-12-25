-- ========================================
-- SIMPLIFIED RLS FOR GITHUB PAGES
-- Run this in Supabase SQL Editor
-- ========================================

-- Allow public to vote (increment only)
DROP POLICY IF EXISTS "Allow update for all" ON vote_options;
CREATE POLICY "Allow vote increment"
ON vote_options FOR UPDATE
USING (true)
WITH CHECK (
  vote_count >= (SELECT vote_count FROM vote_options WHERE id = vote_options.id)
);

-- Allow public to add options
DROP POLICY IF EXISTS "Allow insert for all" ON vote_options;
CREATE POLICY "Allow public insert"
ON vote_options FOR INSERT
WITH CHECK (
  content IS NOT NULL
  AND length(content) > 0
  AND length(content) <= 100
);

-- Only allow delete from admin panel (requires service_role)
-- Client cannot delete directly
DROP POLICY IF EXISTS "Allow delete for all" ON vote_options;
-- No public delete policy = only service_role can delete
