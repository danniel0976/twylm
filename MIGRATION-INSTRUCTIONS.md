# Database Migration for Unlisted Entries

## Step 1: Run This SQL in Supabase Dashboard

**Go to:** https://supabase.com/dashboard → Your twylm project → SQL Editor

**Paste and run:**
```sql
-- Add unlisted column to diary_entries table
ALTER TABLE public.diary_entries 
ADD COLUMN IF NOT EXISTS unlisted BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_diary_entries_unlisted 
ON public.diary_entries(unlisted);
```

**Expected result:** You should see "Success. No rows returned" or similar confirmation.

---

## Step 2: Verify the Column Was Added

Run this query to confirm:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'diary_entries' AND column_name = 'unlisted';
```

You should see:
```
column_name | data_type | column_default
unlisted    | boolean   | false
```

---

## Step 3: Test It

1. **Go to your admin write page:** `https://lovelikenotomorrow.com/admin/write`
2. **Create a new entry** or edit an existing one
3. **Check the new "Unlisted" checkbox** at the bottom
4. **Publish the entry**
5. **Verify:**
   - Entry does NOT appear on the calendar
   - Entry IS accessible via direct link (`/entry/[slug]`)

---

## What Was Changed in Code

**Files modified:**
- `src/app/page.tsx` — Added `.eq('unlisted', false)` filter to calendar query
- `src/app/admin/write/page.tsx` — Added unlisted checkbox + state handling

**Already pushed to GitHub:** ✅
**Vercel will auto-deploy:** ✅ (wait ~2 minutes)

---

## Troubleshooting

**If entries still show on calendar:**
- Wait for Vercel deploy to complete
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- Check browser console for errors

**If unlisted column doesn't exist:**
- Re-run the migration SQL above
- Check Supabase logs for errors

---

Done! 🎉
