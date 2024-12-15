#!/bin/bash

# Remote branch to compare against
REMOTE_BRANCH="origin/develop"

# Fetch the latest changes from the remote repository
git fetch --all

# Check if the remote branch exists
if ! git show-ref --verify --quiet refs/remotes/$REMOTE_BRANCH; then
  echo "Remote branch '$REMOTE_BRANCH' does not exist."
  exit 1
fi

# Generate the comparison and output to changes.md
output_file="changes.md"
echo "# Changes Report" > $output_file
echo "" >> $output_file
echo "This report lists the files that have changed between the local HEAD and the remote branch \`$REMOTE_BRANCH\`." >> $output_file
echo "" >> $output_file
echo "## Files Changed" >> $output_file
echo "| File Path       | Change Type   |" >> $output_file
echo "|-----------------|---------------|" >> $output_file

# Append changed files to the output file
git diff --name-status HEAD $REMOTE_BRANCH | while read line; do
  status=$(echo $line | awk '{print $1}')
  file=$(echo $line | awk '{print $2}')

  # Convert git status codes to human-readable format
  case $status in
    A) change_type="Added" ;;
    M) change_type="Modified" ;;
    D) change_type="Deleted" ;;
    *) change_type="Unknown" ;;
  esac

  echo "| $file | $change_type |" >> $output_file
  echo "$file | $change_type"
done

# Notify user of the output file
echo "Changes have been written to $output_file"
