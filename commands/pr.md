---
name: pr
description: "Create a pull request with KanClaw task context (lightweight — no task status change)"
allowed-tools: Bash(git *), Bash(gh *), mcp__kanclaw__*
---

# /kanclaw:pr

Create a pull request, optionally linking it to a KanClaw task.

This is lighter than `/kanclaw:done` — it creates a PR but does NOT move the task or offer cleanup. Use this when you want a PR without closing the task workflow.

## Steps

### 1. Check for task context

Check if `.kanclaw-task` exists in the current directory:

```bash
if [ -f .kanclaw-task ]; then
    TASK_ID=$(cat .kanclaw-task | tr -d '[:space:]')
fi
```

If found, call `get_task(task_id)` for context. If not found, proceed without task linking.

### 2. Check working tree

Run `git status`. If there are uncommitted changes, ask the user if they want to commit first.

### 3. Gather context

```bash
git log main..HEAD --oneline
git diff main...HEAD --stat
```

### 4. Push

```bash
git push -u origin HEAD
```

### 5. Create PR

Use `gh pr create` with:
- **Title**: Conventional commit format based on the changes
- **Body**: Include:
  - Summary of changes
  - If task context exists: `KanClaw Task: {task_id}`

### 6. Link to KanClaw task (if applicable)

If `.kanclaw-task` was found:
- `add_comment(task_id, content="PR created: {pr_url}")`

Do NOT move the task — that's `/kanclaw:done`'s job.

### 7. Output

Show the PR URL.

## Notes

- Works both inside and outside worktrees
- Never force-push
- If `gh` is not installed, tell the user to create the PR manually and provide a suggested title/body
