-- Rollback: 001_create_stands_and_characters
DROP POLICY IF EXISTS "public read characters" ON characters;
DROP POLICY IF EXISTS "public read stands" ON stands;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS stands;
