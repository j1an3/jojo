-- Migration: 001_create_stands_and_characters
-- Created: 2026-03-26
-- Run this in Supabase Dashboard > SQL Editor (or via supabase CLI)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Bảng stands
CREATE TABLE stands (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL UNIQUE,
  type                TEXT NOT NULL,
  ability_description TEXT,
  stats               JSONB NOT NULL DEFAULT '{}',
  weakness            TEXT,
  scraped_at          TIMESTAMPTZ DEFAULT now(),
  source_url          TEXT
);

-- Bảng characters (Stand Users)
CREATE TABLE characters (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      TEXT NOT NULL,
  stand_id  UUID REFERENCES stands(id) ON DELETE SET NULL,
  part      SMALLINT NOT NULL CHECK (part BETWEEN 1 AND 9),
  status    TEXT,
  image_url TEXT
);

-- Index để tìm kiếm Stand theo tên nhanh (full-text)
CREATE INDEX idx_stands_name ON stands USING gin(to_tsvector('english', name));

-- Index để lọc theo Part
CREATE INDEX idx_characters_part ON characters(part);

-- RLS: public read-only (no auth required)
ALTER TABLE stands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read stands" ON stands FOR SELECT USING (true);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read characters" ON characters FOR SELECT USING (true);
