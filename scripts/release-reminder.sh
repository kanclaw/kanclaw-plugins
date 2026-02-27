#!/bin/bash
# KanClaw PostToolUse hook (matcher: Bash)
# Detects git push and reminds about creating releases

# Guard: if CWD was deleted (e.g., worktree cleanup), exit cleanly
if [ ! -d "$(pwd)" ]; then
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

# Read hook context from stdin
INPUT=$(cat)

# Extract the command that was executed
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Check if it was a git push command
if echo "$COMMAND" | grep -qE 'git\s+push'; then
    MSG="KanClaw: Push detected. If there are done tasks, create a release with create_release."
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"${MSG}\"},\"systemMessage\":\"${MSG}\"}"
else
    echo '{"continue":true,"suppressOutput":true}'
fi
