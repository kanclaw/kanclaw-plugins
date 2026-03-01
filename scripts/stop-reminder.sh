#!/bin/bash
# KanClaw Stop hook
# Reminds about in-progress tasks when session ends
# Uses .kanclaw-task file (created by /worktree) as signal

# Guard: if CWD was deleted (e.g., worktree cleanup), exit cleanly
if [ ! -d "$(pwd)" ]; then
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

if [ -f ".kanclaw-task" ]; then
    TASK_ID=$(tr -d '[:space:]' < .kanclaw-task)
    MSG="KanClaw: Session ending with task ${TASK_ID} active. Remember to update task status (move to review/done) and add a progress comment if work is incomplete."
    printf '{"systemMessage":"%s"}\n' "$MSG"
else
    echo '{"continue":true,"suppressOutput":true}'
fi
