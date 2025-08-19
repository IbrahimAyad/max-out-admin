-- Migration: create_size_definitions_table
-- Created at: 1755575806

-- Create size definitions for different product categories
CREATE TABLE IF NOT EXISTS size_definitions (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  size_code VARCHAR(20) NOT NULL,
  size_label VARCHAR(50) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, size_code)
);;