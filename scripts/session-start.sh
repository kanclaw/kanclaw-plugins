#!/bin/bash
# KanClaw SessionStart hook
# Provides task-aware context at session start

# Check for .kanclaw-task file (created by `kanclaw work`)
if [ -f ".kanclaw-task" ]; then
    TASK_ID=$(tr -d '[:space:]' < .kanclaw-task)
    if [ -n "$TASK_ID" ]; then
        echo "KanClaw: Resuming task ${TASK_ID}"
        echo "Load context with get_task(task_id=\"${TASK_ID}\")."
        echo "Ensure the task is in-progress before starting work."
    fi
    exit 0
fi

# Check if KANCLAW_API_KEY is set
if [ -z "$KANCLAW_API_KEY" ]; then
    echo "KanClaw: KANCLAW_API_KEY not set. Run: export KANCLAW_API_KEY=\"kc_your_key\""
    echo "Get your API key from https://kanclaw.com → Project Settings → API Keys"
    exit 0
fi

# Connected — suggest loading board
echo "KanClaw: Connected. Use get_board to see current tasks."
exit 0
