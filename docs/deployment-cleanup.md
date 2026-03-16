# Deployment Cleanup Routine

## Overview

Keep your deployment history clean by regularly removing failed and redundant deployments from both Vercel and GitHub.

## Why Cleanup?

- **Clean history** - Only successful, meaningful deployments visible
- **Faster debugging** - Less noise when checking deployment status
- **Better organization** - Easy to find the latest working deployment
- **Resource management** - Remove failed builds cluttering the dashboard

## Scripts

### Vercel Cleanup

**Location:** `scripts/cleanup-vercel.js`

**What it does:**
- Deletes all failed deployments (ERROR, CANCELED)
- Keeps only the latest successful (READY) deployment
- Removes redundant older successful deployments

**Usage:**
```bash
# Dry run (see what would be deleted)
node scripts/cleanup-vercel.js <vercel-token> twylm --dry-run

# Actually delete
node scripts/cleanup-vercel.js <vercel-token> twylm
```

**With team ID:**
```bash
node scripts/cleanup-vercel.js <token> <team-id> twylm
```

### GitHub Cleanup

**Location:** `scripts/cleanup-github.js`

**What it does:**
- Deletes all deployment environments
- GitHub auto-recreates them on next deploy
- Cleans up old environment history

**Usage:**
```bash
# Dry run
node scripts/cleanup-github.js <github-token> danniel0976 twylm --dry-run

# Actually delete
node scripts/cleanup-github.js <github-token> danniel0976 twylm
```

## When to Run

### After Major Deployments
- When you push a "version" commit (e.g., v1.0, v1.1)
- After fixing multiple failed builds
- When deployment history gets messy

### Routine Maintenance
- **Weekly:** Check for failed deployments
- **Monthly:** Full cleanup of both Vercel and GitHub
- **Before demos:** Clean slate for presentations

## Automation (Optional)

Create a GitHub Action to auto-cleanup:

```yaml
name: Cleanup Deployments
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Cleanup Vercel
        run: node scripts/cleanup-vercel.js ${{ secrets.VERCEL_TOKEN }} twylm
      - name: Cleanup GitHub
        run: node scripts/cleanup-github.js ${{ secrets.GH_TOKEN }} ${{ github.repository_owner }} ${{ github.event.repository.name }}
```

## Tokens Required

### Vercel Token
- Get from: https://vercel.com/account/tokens
- Create with scope for your project
- Store as `VERCEL_TOKEN` secret

### GitHub Token
- Use `secrets.GITHUB_TOKEN` (auto-provided)
- Or create personal access token with `repo` scope
- Store as `GH_TOKEN` secret

## Best Practices

1. **Always dry-run first** - See what will be deleted
2. **Keep latest success** - Never delete the current production
3. **Document versions** - Tag important deployments before cleanup
4. **Team communication** - Notify team before cleaning shared projects
5. **Backup if needed** - Export deployment logs if debugging

## Example Workflow

```bash
# 1. Check current deployments
vercel ls --all

# 2. Dry run to see candidates
node scripts/cleanup-vercel.js $VERCEL_TOKEN twylm --dry-run

# 3. Review output, then execute
node scripts/cleanup-vercel.js $VERCEL_TOKEN twylm

# 4. Verify cleanup
vercel ls --all

# 5. Clean GitHub environments
node scripts/cleanup-github.js $GH_TOKEN danniel0976 twylm
```

## Notes

- **Vercel:** Keeps 1 latest successful deployment
- **GitHub:** Removes all environments (auto-recreated on next deploy)
- **Failed deployments:** Always safe to delete
- **Production aliases:** Not affected by cleanup
- **Rollback:** Can't rollback to deleted deployments

---

**Maintain clean deployment history for better project hygiene!** 🧹
