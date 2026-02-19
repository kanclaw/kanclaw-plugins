---
name: worktree
description: "Create a git worktree for a KanClaw task — sets up branch, task context file, and moves task to in-progress"
argument-hint: "[task-id or leave blank to pick]"
allowed-tools: Bash(git *), Bash(gh *), Bash(ln *), Bash(ls *), Bash(cat *), Bash(mkdir *), mcp__kanclaw__*
---

# /kanclaw:worktree

Create a dedicated git worktree for a KanClaw task.

## Steps

### 1. Pick a task

If the user provided a task ID as argument, use that. Otherwise:

1. Call `list_tasks(column="todo")` and `list_tasks(column="in-progress")` to show available tasks
2. Present a concise list: ID (first 8 chars), title, priority
3. Ask the user to pick one

### 2. Get task details

Call `get_task(task_id)` to load the full description, checklist, and comments.

### 3. Move to in-progress

Call `move_task(task_id, column="in-progress")` immediately.

### 4. Create the worktree

Determine the repo name and task slug:

```bash
REPO_NAME=$(basename $(git rev-parse --show-toplevel))
# Use first 8 chars of task ID as slug
SLUG=${TASK_ID:0:8}
WORKTREE_PATH="../worktrees/${REPO_NAME}-${SLUG}"
BRANCH_NAME="task/${SLUG}"
```

Create the worktree:
```bash
git worktree add "${WORKTREE_PATH}" -b "${BRANCH_NAME}" origin/main
```

### 5. Set up task context

Write the task ID to `.kanclaw-task` in the worktree root:
```bash
echo "${TASK_ID}" > "${WORKTREE_PATH}/.kanclaw-task"
```

### 6. Symlink shared config

If `.mcp.json` exists in the root repo, symlink it:
```bash
ln -sf "$(git rev-parse --show-toplevel)/.mcp.json" "${WORKTREE_PATH}/.mcp.json"
```

If `.claude/` exists, symlink it too:
```bash
ln -sf "$(git rev-parse --show-toplevel)/.claude" "${WORKTREE_PATH}/.claude"
```

### 7. Output

Tell the user:
- Worktree created at `${WORKTREE_PATH}`
- Branch: `${BRANCH_NAME}`
- Task moved to in-progress
- Next step: open Claude Code in the worktree directory (`cd ${WORKTREE_PATH} && claude`)

## Notes

- If the worktree path already exists, ask the user before overwriting
- If the branch already exists, use `git worktree add "${WORKTREE_PATH}" "${BRANCH_NAME}"` (without `-b`)
- Always move the task to in-progress — this is the locking mechanism
