---
name: done
description: "Finish work on current KanClaw task — create PR, move task to review, offer worktree cleanup"
allowed-tools: Bash(git *), Bash(gh *), Bash(rm *), mcp__kanclaw__*
---

# /kanclaw:done

Wrap up work on the current KanClaw task: commit, PR, move to review.

## Prerequisites

This command expects a `.kanclaw-task` file in the current directory. If not found, tell the user this command only works in a worktree created by `/kanclaw:worktree`.

## Steps

### 1. Read task context

```bash
TASK_ID=$(cat .kanclaw-task | tr -d '[:space:]')
```

Call `get_task(task_id)` to get the task title and description.

### 2. Check for uncommitted changes

Run `git status`. If there are uncommitted changes, ask the user if they want to commit first. If yes, stage and commit with a conventional commit message derived from the task title.

### 3. Gather work summary

```bash
git log main..HEAD --oneline
git diff main...HEAD --stat
```

### 4. Push and create PR

```bash
git push -u origin HEAD
```

Create a PR with `gh pr create`:
- **Title**: Conventional commit format based on task title (e.g., `feat: add task dependencies`)
- **Body**: Include:
  - Summary of changes (from git log)
  - KanClaw task reference: `KanClaw Task: {task_id}`
  - Files changed summary

### 5. Update KanClaw task

1. `add_comment(task_id, content="PR created: {pr_url}")` — link the PR on the task
2. `move_task(task_id, column="review")` — signal it's ready for review

### 6. Offer cleanup

Ask the user if they want to clean up the worktree:

```bash
cd ..
git worktree remove <worktree-path>
```

If yes, remove it. If no, leave it for potential follow-up work.

## Output

Summarize what was done:
- PR URL
- Task moved to review
- Whether worktree was cleaned up

## Notes

- Never force-push. If push fails, let the user know and suggest `git pull --rebase`
- If `gh` is not installed, skip PR creation and tell the user to create it manually
- If the task is already in review or done, skip the `move_task` step and warn
