#!/bin/bash

# --- Configuration ---
# File used to force a commit and update the PR
TRIGGER_FILE=".pr_trigger"
# Prefix for the new branch name
BRANCH_PREFIX="feature/auto-"
# Hard-coded base branch
DEFAULT_BRANCH="gh-pages"

# Get the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2> /dev/null)
if [ "$?" -ne 0 ]; then
    echo "❌ Error: Not in a Git repository."
    exit 1
fi
# --- Helper Functions ---

# Function to generate a unique branch name
generate_branch_name() {
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    counter=$(( (RANDOM % 26) ))
    identifier=$(printf %c $((counter + 97)))
    echo "${BRANCH_PREFIX}${identifier}-${TIMESTAMP}"
}

# --- Main Script Logic ---

# 1. Force a change by updating a hidden file (silent)
CURRENT_TIME=$(date +'%Y-%m-%d %H:%M:%S')
echo "Last run: $CURRENT_TIME" > "$TRIGGER_FILE"

# 2. Stage and commit all changes (silent)
git add -A > /dev/null 2>&1

COMMIT_MESSAGE="Auto-commit: $CURRENT_TIME - Automated PR update."
git commit -m "$COMMIT_MESSAGE" > /dev/null 2>&1

# 3. Interactive Menu (The ONLY prompt shown before the URL)
echo ""
PS3="Select action: "
options=("Create New Pull Request (New Branch)" "Update Existing Pull Request (Current Branch)")
select opt in "${options[@]}"
do
    case $opt in
        "Create New Pull Request (New Branch)")
            # Create New PR flow: Create and switch to a new branch (silent)
            NEW_BRANCH_NAME=$(generate_branch_name)
            git checkout -b "$NEW_BRANCH_NAME" > /dev/null 2>&1
            BRANCH_TO_USE="$NEW_BRANCH_NAME"
            ACTION="CREATE"
            break
            ;;
        "Update Existing Pull Request (Current Branch)")
            # Update Existing PR flow: Stay on current branch
            BRANCH_TO_USE="$CURRENT_BRANCH"
            ACTION="UPDATE"
            break
            ;;
        *) echo "Invalid option $REPLY. Please select 1 or 2.";;
    esac
done

# 4. Push the changes to the remote repository
# Note: This is the ONLY step that might require interaction (SSH passphrase)
# We suppress the output but allow any SSH/Git errors to show.
if ! git push -u origin "$BRANCH_TO_USE"; then
    echo "----------------------------------------------"
    echo "❌ **FATAL ERROR: Git push failed.** Please fix your SSH/access rights."
    echo "----------------------------------------------"
    exit 1
fi

# 5. Execute PR Action (Create or Update)
PR_TITLE="[Auto-PR] ${COMMIT_MESSAGE}"
PR_URL=""

if [ "$ACTION" == "CREATE" ]; then
    # Create PR (silent)
    PR_URL=$(gh pr create --title "$PR_TITLE" --body "**Automated Pull Request**" --head "$BRANCH_TO_USE" --base "$DEFAULT_BRANCH" --fill)
    
elif [ "$ACTION" == "UPDATE" ]; then
    # Get existing PR URL (silent)
    PR_URL=$(gh pr view "$BRANCH_TO_USE" --json url -q .url 2>/dev/null)
    
    if [ -z "$PR_URL" ]; then
        # Create new PR if none found (silent)
        PR_URL=$(gh pr create --title "$PR_TITLE" --body "**Automated Pull Request**" --head "$BRANCH_TO_USE" --base "$DEFAULT_BRANCH" --fill)
    fi
fi

# 6. Display Result (Only the URL)
echo "----------------------------------------------"
if [ -n "$PR_URL" ]; then
    echo "🔗 **Pull Request URL:** $PR_URL"
else
    echo "❌ **Action Failed.** Could not determine or create the Pull Request URL."
fi
echo "----------------------------------------------"

