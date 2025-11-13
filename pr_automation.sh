#!/bin/bash

# --- Configuration ---
# File used to force a commit and update the PR
TRIGGER_FILE=".pr_trigger"
# Prefix for the branch name
BRANCH_PREFIX="feature/auto-"

# Get the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$?" -ne 0 ]; then
    echo "❌ Error: Not in a Git repository."
    exit 1
fi

# Attempt to determine the default branch, but if it fails, prompt the user
DEFAULT_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}')
if [ -z "$DEFAULT_BRANCH" ]; then
    echo "⚠️ Warning: Could not automatically determine the base branch (e.g., main/master)."
    read -r -p "Enter your repository's default branch name (e.g., main or master): " DEFAULT_BRANCH
    if [ -z "$DEFAULT_BRANCH" ]; then
        echo "❌ Base branch name is required. Exiting."
        exit 1
    fi
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
    echo "❌ Git add failed. Check file permissions."
    exit 1
fi

COMMIT_MESSAGE="Auto-commit: $CURRENT_TIME - Automated PR update."
echo "➡️ Committing changes with message: **${COMMIT_MESSAGE}**"
if ! git commit -m "$COMMIT_MESSAGE"; then
    echo "⚠️ No changes to commit. Proceeding to PR options."
fi

# 3. Interactive Menu
echo ""
PS3="Select action: "
options=("Create New Pull Request (New Branch)" "Update Existing Pull Request (Current Branch)")
select opt in "${options[@]}"
do
    case $opt in
        "Create New Pull Request (New Branch)")
            # Create New PR flow
            NEW_BRANCH_NAME=$(generate_branch_name)
            echo "💡 Creating new branch: **$NEW_BRANCH_NAME**"
            git checkout -b "$NEW_BRANCH_NAME"
            BRANCH_TO_USE="$NEW_BRANCH_NAME"
            ACTION="CREATE"
            break
            ;;
        "Update Existing Pull Request (Current Branch)")
            # Update Existing PR flow
            BRANCH_TO_USE="$CURRENT_BRANCH"
            ACTION="UPDATE"
            break
            ;;
        *) echo "Invalid option $REPLY";;
    esac
done

# 4. Push the changes to the remote repository
echo "➡️ Pushing changes to remote branch: **$BRANCH_TO_USE**"
if ! git push -u origin "$BRANCH_TO_USE"; then
    echo "❌ Git push failed. Please ensure SSH agent is running and you have access rights."
    # We exit here because we cannot proceed without a successful push
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
        echo "⚠️ No existing PR found. Creating a new one for this branch."
        PR_URL=$(gh pr create --title "$PR_TITLE" --body "**Automated Pull Request**" --head "$BRANCH_TO_USE" --base "$DEFAULT_BRANCH" --fill)
    fi
fi

# 6. Display Result (Only the URL and a clean message)
echo "----------------------------------------------"
if [ -n "$PR_URL" ]; then
    echo "🎉 **Success!** Pull Request action complete."
    echo "🔗 **Pull Request URL:** $PR_URL"
    # Provide a direct command to open the URL
    echo "To visit the URL now, copy and paste this command into your terminal:"
    echo "open $PR_URL"
else
    echo "❌ **Action Failed.** Could not determine or create the Pull Request URL."
fi
echo "----------------------------------------------"

