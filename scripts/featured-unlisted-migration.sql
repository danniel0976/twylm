-- Migration: Featured + Unlisted columns for diary_entries
-- Run this in Supabase SQL Editor if columns don't exist yet

-- Add unlisted column (if not exists from previous migration)
ALTER TABLE public.diary_entries 
  ADD COLUMN IF NOT EXISTS unlisted BOOLEAN DEFAULT FALSE;

-- Add featured column
ALTER TABLE public.diary_entries 
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Drop old unique constraint (allows multiple entries per date)
ALTER TABLE public.diary_entries 
  DROP CONSTRAINT IF EXISTS diary_entries_user_id_date_key;

-- Partial unique index: only ONE featured entry per user per date
CREATE UNIQUE INDEX IF NOT EXISTS diary_entries_user_id_date_featured_idx 
  ON public.diary_entries (user_id, date) 
  WHERE featured = TRUE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_diary_entries_featured ON public.diary_entries(featured);
CREATE INDEX IF NOT EXISTS idx_diary_entries_unlisted ON public.diary_entries(unlisted);

-- Initialize existing entries as featured (preserve current calendar behavior)
UPDATE public.diary_entries 
  SET featured = TRUE 
  WHERE featured IS NULL OR featured = FALSE;
