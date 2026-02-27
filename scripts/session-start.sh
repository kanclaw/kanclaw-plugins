#!/bin/bash
# KanClaw SessionStart hook
# Outputs JSON per Claude Code hook protocol
# Note: grep-based .mcp.json check is intentional — jq may not be installed

# Guard: if CWD was deleted (e.g., worktree cleanup), exit cleanly
if [ ! -d "$(pwd)" ]; then
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")

# Sanitize a string for safe JSON embedding (escape backslashes, quotes, newlines)
json_escape() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\n/\\n/g'
}

# Determine message based on MCP config state
if [ -f ".kanclaw-task" ]; then
    TASK_ID=$(tr -d '[:space:]' < .kanclaw-task)
    TASK_ID=$(json_escape "$TASK_ID")
    CONTEXT="KanClaw: Resuming task ${TASK_ID}. Load context with get_task(task_id=\"${TASK_ID}\"). Ensure the task is in-progress before starting work."
    DISPLAY="KanClaw: Resuming task ${TASK_ID}"
elif [ -f "${PROJECT_ROOT}/.mcp.json" ] && grep -q '"kanclaw"' "${PROJECT_ROOT}/.mcp.json" 2>/dev/null; then
    CONTEXT="KanClaw: MCP connected. Use get_board to see current tasks."
    DISPLAY="KanClaw: MCP connected"
else
    CONTEXT="KanClaw: MCP server not configured for this project. Run /setup-kc to connect your KanClaw board (you'll need your API key from Project Settings > API Keys at kanclaw.com)."
    DISPLAY="KanClaw: MCP not configured. Run /setup-kc to connect your board."
fi

# Output JSON per Claude Code hook protocol
printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"},"systemMessage":"%s"}\n' \
    "$(json_escape "$CONTEXT")" "$(json_escape "$DISPLAY")"
