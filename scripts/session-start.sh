#!/bin/bash
# KanClaw SessionStart hook
# Outputs JSON per Claude Code hook protocol

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")

# Determine message based on MCP config state
if [ -f ".kanclaw-task" ]; then
    TASK_ID=$(tr -d '[:space:]' < .kanclaw-task)
    CONTEXT="KanClaw: Resuming task ${TASK_ID}. Load context with get_task(task_id=\"${TASK_ID}\"). Ensure the task is in-progress before starting work."
    DISPLAY="KanClaw: Resuming task ${TASK_ID}"
elif [ -f "${PROJECT_ROOT}/.mcp.json" ] && grep -q '"kanclaw"' "${PROJECT_ROOT}/.mcp.json" 2>/dev/null; then
    CONTEXT="KanClaw: MCP connected. Use get_board to see current tasks."
    DISPLAY="KanClaw: MCP connected"
else
    CONTEXT="KanClaw: MCP server not configured for this project. Run /setup-kc to connect your KanClaw board (you'll need your API key from Project Settings → API Keys at kanclaw.com)."
    DISPLAY="KanClaw: MCP not configured. Run /setup-kc to connect your board."
fi

# Output JSON per Claude Code hook protocol
cat <<EOF
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"${CONTEXT}"},"systemMessage":"${DISPLAY}"}
EOF
