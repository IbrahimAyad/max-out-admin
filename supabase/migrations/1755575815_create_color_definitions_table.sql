-- Migration: create_color_definitions_table
-- Created at: 1755575815

-- Create color definitions
CREATE TABLE IF NOT EXISTS color_definitions (
  id BIGSERIAL PRIMARY KEY,
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(50) NOT NULL,
  hex_value VARCHAR(7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(color_code)
);;