#!/bin/bash

# --- Configuration ---
# FILE: Used to force a commit and update the PR
TRIGGER_FILE=".pr_trigger"
# PREFIX: For the new branch name when creating a new PR
BRANCH_PREFIX="feature/auto-"
# DEFAULT_BRANCH: HARD-CODED BASE BRANCH as requested by the user.
DEFAULT_BRANCH="gh-pages"

# Get the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$?" -ne 0 ]; then
    echo "❌ Error: Not in a Git repository."
    exit 1
fi
# --- Helper Functions ---

# Function to generate a unique branch name
generate_branch_name() {
    # Using format compatible with more shells
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    
    # Simple letter identifier
    counter=$(( (RANDOM % 26) ))
    identifier=$(printf %c $((counter + 97)))

    echo "${BRANCH_PREFIX}${identifier}-${TIMESTAMP}"
}

# --- Main Script Logic ---

echo "🤖 Starting Git Pull Request Automation Script..."
echo "----------------------------------------------"

# 1. Force a change by updating a hidden file
CURRENT_TIME=$(date +'%Y-%m-%d %H:%M:%S')
echo "🕰️ Forcing update by writing timestamp to **$TRIGGER_FILE**"
echo "Last run: $CURRENT_TIME" > "$TRIGGER_FILE"

# 2. Stage and commit all changes
echo "➡️ Staging all modified and new files..."
if ! git add -A; then
    echo "❌ Git add failed. Check file permissions in the .git directory."
    exit 1
fi

COMMIT_MESSAGE="Auto-commit: $CURRENT_TIME - Automated PR update."
echo "➡️ Committing changes with message: **${COMMIT_MESSAGE}**"
# Commit, but capture output to see if there were changes
COMMIT_STATUS_OUTPUT=$(git commit -m "$COMMIT_MESSAGE" 2>&1)
if echo "$COMMIT_STATUS_OUTPUT" | grep -q "nothing to commit"; then
    echo "⚠️ Commit skipped: No new changes detected after staging."
fi


# 3. Interactive Menu (The "Codex" Choice)
echo ""
PS3="Select action: "
options=("Create New Pull Request (New Branch)" "Update Existing Pull Request (Current Branch)")
select opt in "${options[@]}"
do
    case $opt in
        "Create New Pull Request (New Branch)")
            # Create New PR flow: Create and switch to a new branch
            NEW_BRANCH_NAME=$(generate_branch_name)
            echo "💡 Creating new branch: **$NEW_BRANCH_NAME**"
            git checkout -b "$NEW_BRANCH_NAME"
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
echo "➡️ Pushing changes to remote branch: **$BRANCH_TO_USE**"
if ! git push -u origin "$BRANCH_TO_USE"; then
    echo "----------------------------------------------"
    echo "❌ **FATAL ERROR: Git push failed.**"
    echo "Check 1: Run 'ssh -T git@github.com' to test your SSH key."
    echo "Check 2: Ensure your key is loaded into the SSH agent using 'ssh-add'."
    echo "----------------------------------------------"
    exit 1
fi

# 5. Execute PR Action (Create or Update)
PR_TITLE="[Auto-PR] ${COMMIT_MESSAGE}"
PR_URL=""

if [ "$ACTION" == "CREATE" ]; then
    echo "🚀 Creating a new Pull Request..."
    
    PR_URL=$(gh pr create --title "$PR_TITLE" --body "**Automated Pull Request**" --head "$BRANCH_TO_USE" --base "$DEFAULT_BRANCH" --fill)
    
    if [ "$?" -ne 0 ]; then
        echo "❌ **Error creating Pull Request using GitHub CLI.**"
    fi

elif [ "$ACTION" == "UPDATE" ]; then
    echo "🔄 **Updating existing Pull Request...**"
    
    # Try to get the existing PR URL
    PR_URL=$(gh pr view "$BRANCH_TO_USE" --json url -q .url 2>/dev/null)
    
    if [ -z "$PR_URL" ]; then
        echo "⚠️ No existing PR found for branch **$BRANCH_TO_USE**. Creating a new one."
        PR_URL=$(gh pr create --title "$PR_TITLE" --body "**Automated Pull Request**" --head "$BRANCH_TO_USE" --base "$DEFAULT_BRANCH" --fill)
    fi
fi

# 6. Display Result (Clean UI for the final outcome)
echo "----------------------------------------------"
if [ -n "$PR_URL" ]; then
    echo "🎉 **Success!** Pull Request action complete."
    echo "🔗 **Pull Request URL:** $PR_URL"
    # Provide a helper command to visit the URL (common on Linux/Mac)
    echo "----------------------------------------------"
else
    echo "❌ **Action Failed.** Could not determine or create the Pull Request URL."
    echo "Please check the errors above."
    echo "----------------------------------------------"
fi

