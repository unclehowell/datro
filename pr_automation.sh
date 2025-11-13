#!/bin/bash

# --- Configuration ---
# File used to force a commit and update the PR
TRIGGER_FILE=".pr_trigger"
# Prefix for the branch name
BRANCH_PREFIX="feature/auto-"
# Get the current local repository's default branch (e.g., main or master)
DEFAULT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$?" -ne 0 ]; then
    echo "❌ Error: Not in a Git repository."
    exit 1
fi
# --- Helper Functions ---

# Function to generate a unique branch name
generate_branch_name() {
    # Get the current date and time in YYYYMMDD-HHMMSS format
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    
    # Generate a unique alphabetical identifier (simple counter)
    local identifier="a"
    local counter=0
    # Use a simpler, non-looping identifier for efficiency
    # The combination of the letter and the high-precision timestamp should be unique enough
    
    # Cycle through a few letters (a-z) to give some variety
    counter=$(( (RANDOM % 26) ))
    identifier=$(printf %c $((counter + 97)))

    echo "${BRANCH_PREFIX}${identifier}-${TIMESTAMP}"
}

# --- Main Script Logic ---

echo "🤖 Starting Git Pull Request Automation Script..."
echo "----------------------------------------------"

# 1. Force a change by updating a hidden file with the current timestamp
CURRENT_TIME=$(date +'%Y-%m-%d %H:%M:%S')
echo "🕰️ Forcing update by writing timestamp to **$TRIGGER_FILE**"
echo "Last run: $CURRENT_TIME" > $TRIGGER_FILE

# 2. Stage all modified files, including the trigger file
echo "➡️ Staging all modified and new files..."
git add -A

# 3. Check for uncommitted changes (now guaranteed to have them due to the trigger file)
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No new changes to commit (this should not happen with the trigger file). Exiting."
    exit 0
fi

# 4. Generate automatic commit message
COMMIT_MESSAGE="Auto-commit: $CURRENT_TIME - Automated PR update."
echo "➡️ Committing changes with message: **${COMMIT_MESSAGE}**"
git commit -m "$COMMIT_MESSAGE"

# 5. Determine Branch Action
# We assume the user wants to continue updating an existing PR if they are on a feature branch.
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" == "main" ] || [ "$CURRENT_BRANCH" == "master" ]; then
    # Currently on a default branch -> **Create New PR** flow
    NEW_BRANCH_NAME=$(generate_branch_name)
    echo "💡 Detected branch is default ($CURRENT_BRANCH). Creating new branch: **$NEW_BRANCH_NAME**"
    git checkout -b "$NEW_BRANCH_NAME"
    BRANCH_TO_USE="$NEW_BRANCH_NAME"
    ACTION="CREATE"
else
    # Currently on a feature branch -> **Update Existing PR** flow
    echo "💡 Detected non-default branch: **$CURRENT_BRANCH**"
    BRANCH_TO_USE="$CURRENT_BRANCH"
    ACTION="UPDATE"
fi

# 6. Push the changes to the remote repository
echo "➡️ Pushing changes to remote branch: **$BRANCH_TO_USE**"
# Note: You may be prompted for your SSH key passphrase here.
git push -u origin "$BRANCH_TO_USE"

# 7. Execute PR Action (Create or Update)
PR_TITLE="[Auto-PR] ${COMMIT_MESSAGE}"

if [ "$ACTION" == "CREATE" ]; then
    echo "🚀 Creating a new Pull Request..."
    
    # Use gh CLI to create the PR
    PR_URL=$(gh pr create --title "$PR_TITLE" --body "**Automated Pull Request**" --head "$BRANCH_TO_USE" --base "$DEFAULT_BRANCH" --fill)
    
    if [ "$?" -eq 0 ]; then
        echo "🎉 **Successfully created Pull Request!**"
        echo "🔗 **Pull Request URL:** $PR_URL"
    else
        echo "❌ **Error creating Pull Request using GitHub CLI.** Check authentication."
    fi

elif [ "$ACTION" == "UPDATE" ]; then
    echo "🔄 **Updating existing Pull Request...**"
    
    # Find the PR URL for the current branch
    PR_URL=$(gh pr view "$BRANCH_TO_USE" --json url -q .url 2>/dev/null)
    
    if [ -n "$PR_URL" ]; then
        echo "🎉 **Successfully updated existing Pull Request!**"
        echo "🔗 **Pull Request URL:** $PR_URL"
    else
        echo "⚠️ Could not find an existing Pull Request for branch **$BRANCH_TO_USE**. Attempting to create a new one."
        # Attempt to create one if it doesn't exist
        PR_URL=$(gh pr create --title "$PR_TITLE" --body "**Automated Pull Request**" --head "$BRANCH_TO_USE" --base "$DEFAULT_BRANCH" --fill)
        if [ "$?" -eq 0 ]; then
            echo "🎉 **Successfully created new Pull Request!**"
            echo "🔗 **Pull Request URL:** $PR_URL"
        else
            echo "❌ **Error creating Pull Request using GitHub CLI.**"
        fi
    fi
fi

echo "----------------------------------------------"
echo "✅ Script finished."
echo "To view your deployment preview, visit the provided PR URL and check the Checks/Deployments section for the Vercel/Netlify/Worker preview link."

