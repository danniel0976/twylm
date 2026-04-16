# Dan's File Drop

**Access:** https://www.lovelikenotomorrow.com/files/

**Purpose:** Private file drop for Dan to easily retrieve files from any device.

---

## How Chippy Uses This

1. Write file to `public/files/<filename>`
2. Update `index.html` with new file entry
3. Commit and push
4. Vercel auto-deploys
5. Dan accesses at the URL above

---

## Current Files

See `index.html` for the file registry.

---

## Security Notes

- Files are publicly accessible if someone knows the URL
- Don't store sensitive data here
- Delete files after use if needed
