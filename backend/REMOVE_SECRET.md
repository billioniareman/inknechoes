# Removing Secret from Git History

## Steps to Fix:

1. **Stash current changes:**
   ```bash
   git stash
   ```

2. **Use git filter-branch to remove the secret:**
   ```bash
   git filter-branch --force --index-filter "git rm --cached --ignore-unmatch backend/app/config.py" --prune-empty --tag-name-filter cat -- --all
   ```

3. **Or use BFG Repo-Cleaner (easier):**
   ```bash
   # Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
   java -jar bfg.jar --replace-text passwords.txt backend/app/config.py
   ```

4. **Force push (WARNING: This rewrites history):**
   ```bash
   git push origin --force --all
   ```

## ⚠️ IMPORTANT:
- **Regenerate your Brevo API key** - it's been exposed in git history
- Coordinate with your team before force pushing
- The secret is still in GitHub's history even after removal

