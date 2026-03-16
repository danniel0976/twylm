-- TWYLM Supabase RLS Policies
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rtvrfzfgudmqanhqkxir/sql

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can insert own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Enable RLS on diary_entries table (should already be enabled)
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- Policy 4: Users can view own entries
CREATE POLICY "Users can view own entries"
  ON diary_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 5: Users can insert own entries
CREATE POLICY "Users can insert own entries"
  ON diary_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 6: Users can update own entries
CREATE POLICY "Users can update own entries"
  ON diary_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy 7: Users can delete own entries
CREATE POLICY "Users can delete own entries"
  ON diary_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Run this SQL in Supabase Dashboard:
-- https://supabase.com/dashboard/project/rtvrfzfgudmqanhqkxir/sql
