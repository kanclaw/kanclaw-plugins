#!/bin/bash
# KanClaw Stop hook
# Reminds about in-progress tasks when session ends
# Uses .kanclaw-task file (created by /worktree) as signal

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")

if [ -f ".kanclaw-task" ]; then
    TASK_ID=$(tr -d '[:space:]' < .kanclaw-task)
    MSG="KanClaw: Session ending with task ${TASK_ID} active. Remember to update task status (move to review/done) and add a progress comment if work is incomplete."
    printf '{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"%s"},"systemMessage":"%s"}\n' "$MSG" "$MSG"
elif [ -f "${PROJECT_ROOT}/.kanclaw-task" ]; then
    TASK_ID=$(tr -d '[:space:]' < "${PROJECT_ROOT}/.kanclaw-task")
    MSG="KanClaw: Session ending with task ${TASK_ID} active. Remember to update task status (move to review/done) and add a progress comment if work is incomplete."
    printf '{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"%s"},"systemMessage":"%s"}\n' "$MSG" "$MSG"
else
    echo '{"continue":true,"suppressOutput":true}'
fi
