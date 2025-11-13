#!/bin/bash

# --- Configuration ---
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
    # The script will try to use the next available letter (a, b, c, ...)
    local identifier="a"
    local counter=0
    while git show-ref --quiet --verify "refs/heads/${BRANCH_PREFIX}${identifier}-${TIMESTAMP}"; do
        counter=$((counter + 1))
        # Simple cycle: 'a', 'b', ..., 'z', 'aa', 'ab', ...
        identifier=$(printf "%s" $(echo "scale=0; ${counter}/26" | bc) | tr -d '\n')
        identifier=$(printf "%s%c" "$identifier" "$(printf \\$(echo "obase=8; $((counter % 26 + 97))" | bc))")
        # Ensure identifier doesn't get too long for practical use
        if [ $counter -gt 100 ]; then
            echo "⚠️ Warning: Excessive branch name generation attempts. Using a high number."
            identifier="max-${counter}"
            break
        fi
    done

    echo "${BRANCH_PREFIX}${identifier}-${TIMESTAMP}"
}

# --- Main Script Logic ---

echo "🤖 Starting Git Pull Request Automation Script..."
echo "----------------------------------------------"

# 1. Check for uncommitted changes
if [ -z "$(git status -s)" ]; then
    echo "✅ No uncommitted changes detected. Nothing to do."
    exit 0
fi

# 2. Stage all modified files
echo "➡️ Staging all modified and new files..."
git add -A

# 3. Generate automatic commit message
COMMIT_MESSAGE="Auto-commit: $(date +'%Y-%m-%d %H:%M:%S') - Automated update."
echo "➡️ Committing changes with message: **${COMMIT_MESSAGE}**"
git commit -m "$COMMIT_MESSAGE"

# 4. Determine Branch Action
# Try to find a branch that is *not* the default branch
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

# 5. Push the changes to the remote repository
echo "➡️ Pushing changes to remote branch: **$BRANCH_TO_USE**"
git push -u origin "$BRANCH_TO_USE"

# 6. Execute PR Action (Create or Update)
PR_TITLE="[Auto-PR] ${COMMIT_MESSAGE}"

if [ "$ACTION" == "CREATE" ]; then
    echo "🚀 Creating a new Pull Request..."
    
    # Use gh CLI to create the PR
    PR_URL=$(gh pr create --title "$PR_TITLE" --body "**Automated Pull Request**" --head "$BRANCH_TO_USE" --base "$DEFAULT_BRANCH" --fill)
    
    if [ "$?" -eq 0 ]; then
        echo "🎉 **Successfully created Pull Request!**"
        echo "🔗 **Pull Request URL:** $PR_URL"
    else
        echo "❌ **Error creating Pull Request using GitHub CLI.** Please check your permissions and connectivity."
    fi

elif [ "$ACTION" == "UPDATE" ]; then
    # When updating, we just pushed to the existing branch.
    # The push operation itself updates the existing PR linked to that branch.
    echo "🔄 **Updating existing Pull Request...**"
    
    # Find the PR URL for the current branch
    PR_URL=$(gh pr view "$BRANCH_TO_USE" --json url -q .url 2>/dev/null)
    
    if [ -n "$PR_URL" ]; then
        echo "🎉 **Successfully updated existing Pull Request!**"
        echo "🔗 **Pull Request URL:** $PR_URL"
    else
        echo "⚠️ Could not find an existing Pull Request for branch **$BRANCH_TO_USE**. You may need to create it manually, or it was already merged."
        # Offer to create one if it doesn't exist
        echo "Attempting to create a new PR for this branch..."
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
# Final instruction to the user
echo "To view your deployment preview, visit the provided PR URL and check the Checks/Deployments section for the Vercel/Netlify/Worker preview link, as configured by your .github/worker/yml file."

# Return to the previous branch (before checkout if a new branch was created)
# This is optional, but often cleaner. We skip it to keep the user on the feature branch.
# if [ "$ACTION" == "CREATE" ]; then
#     echo "➡️ Returning to original branch: **$DEFAULT_BRANCH**"
#     git checkout "$DEFAULT_BRANCH"
# fi

