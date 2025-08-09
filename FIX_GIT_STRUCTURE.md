# Fix Git Repository Structure

The issue is that Git was initialized in your home directory instead of the project directory. Here's how to fix it:

## Option 1: Create a New Clean Repository (Recommended)

1. First, save your current work
2. Remove the current git connection
3. Create a new repository with proper structure

```bash
# Step 1: Remove current git connection (from project directory)
cd /Users/user/Desktop/apps/MENTOR
rm -rf .git  # This removes local git (if any)

# Step 2: Initialize new git repo in the correct location
git init

# Step 3: Add all files
git add .

# Step 4: Commit
git commit -m "Initial commit: MENTOR Teacher Observation System"

# Step 5: Add remote
git remote add origin https://github.com/chhinhsovath/MENTOR.git

# Step 6: Force push to clean up the repository
git push -f origin main
```

## Option 2: Move Files in Current Repository

If you want to keep the commit history:

```bash
# From the home directory where .git is
cd /Users/user

# Create a temporary branch
git checkout -b temp-fix

# Move all MENTOR files to root
git mv Desktop/apps/MENTOR/* .
git mv Desktop/apps/MENTOR/.* . 2>/dev/null || true

# Remove empty directories
git rm -r Desktop

# Commit the restructure
git commit -m "Restructure: Move project files to repository root"

# Push to main
git checkout main
git merge temp-fix
git push origin main
```

## Why This Happened

The `.git` directory was created in `/Users/user` instead of `/Users/user/Desktop/apps/MENTOR`, causing all file paths to be relative to your home directory.

## Prevention

Always run `git init` in your project directory, not in parent directories.