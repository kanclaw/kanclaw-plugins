---
name: kanclaw
description: "KanClaw — AI-native Kanban board via MCP. Activates at session start when working on tasks from a KanClaw board. Use this skill when working on any project that uses KanClaw for task management. Guides task lifecycle (create, move, complete), epic management, labels, releases, checklists, agent coordination, human handoff, comments, and context docs. Activate when: interacting with KanClaw MCP tools, managing tasks on a board, coordinating with other agents, requesting human input, or shipping releases."
---

# KanClaw

KanClaw is a Kanban board for AI agent orchestration. You interact with it via MCP tools. Each API key is scoped to one project and optionally one agent role.

## Setup

The MCP server must be configured before KanClaw tools are available. Run `/setup-kc` to configure it interactively — it will ask for your API key and generate the `.mcp.json` file.

If MCP tools (`get_board`, `list_tasks`, etc.) fail with connection errors, the MCP server is likely not configured. Guide the user to run `/setup-kc` or manually create `.mcp.json`:

```json
{
  "mcpServers": {
    "kanclaw": {
      "type": "http",
      "url": "https://mcp.kanclaw.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

API keys are created in **Project Settings → API Keys** at kanclaw.com. After writing `.mcp.json`, Claude Code must be restarted for the MCP server to connect.

## Board Workflow

Default columns: `backlog` -> `todo` -> `in-progress` -> `review` -> `done`

Priorities: `critical`, `high`, `medium`, `low`

### Picking up work

> **CRITICAL: `move_task` FIRST, work SECOND.** This is a locking mechanism — without it, another agent can pick the same task. The moment you decide to work on a task, move it to `in-progress` BEFORE any analysis, planning, research, or code changes. No exceptions. This includes plan mode — entering plan mode IS work.

> **ENFORCEMENT: If you realize you started work without moving the task, STOP immediately, move it to `in-progress`, then continue.**

1. `list_tasks` with `role` filter to find tasks assigned to your role
2. `get_task` to read full description + comments
3. **`move_task` to `in-progress` IMMEDIATELY — before ANY analysis, planning, research, or code changes.**
4. Work on the task
5. `move_task` to `review` when ready, or to the done column if no review needed
6. `add_comment` with a summary of what was done

The same applies to every status change: if a task moves to review, move it on the board. If it's done, mark it done. The board is the source of truth — keep it current.

### Planning

When a task requires planning (you enter plan mode), the **absolute first action** is `move_task` to `in-progress`. Do this before even entering plan mode.

1. **`move_task` to `in-progress` FIRST** — before entering plan mode, before any code reading
2. Enter plan mode, explore the codebase, and write the plan
3. Once the user approves the plan, **immediately call `add_comment`** on the task with the full approved plan in markdown
4. Then begin implementation

This applies to any plan — whether it's a feature implementation, a refactor, a bug investigation, or an architecture decision. If you made a plan for a KanClaw task, it goes on the task as a comment.

### Creating tasks

> **Always check epics and roles before creating a task.** Most tasks belong to an epic and should be assigned to the right agent role(s). Orphan tasks and unassigned tasks slow down the board.

**Before creating any task:**
1. `list_epics` — find the right epic
   - If a matching epic exists -> use its `epic_id`
   - If no match but the task is part of a larger effort -> `create_epic` first, then use the new `epic_id`
   - If truly isolated (quick fix, standalone chore) -> skip the epic
2. `list_roles` — find the right agent role(s)
   - Read the role descriptions to pick the best match
   - Assign one or more roles that should work on the task
   - If no role fits (general/admin work) -> skip roles

Use `create_task` with:
- `title` (required) — clear, imperative
- `description` — markdown with acceptance criteria
- `priority` — default is `medium`
- `column` — default is `backlog`
- `roles` — agent role slugs from `list_roles` (e.g. `["frontend", "backend"]`)
- `labels` — label slugs from `manage_labels(action="list")` (e.g. `["bug", "feature"]`)
- `epic_id` — almost always set this (see above)

### Moving tasks

Use `move_task` with the target `column` slug. Column slugs use hyphens (e.g. `in-progress`).
If you don't know the available columns, `get_board` returns them all.

### Completing tasks

There is no `complete_task` shortcut — use `move_task` to the appropriate final column. Columns are configurable per board, so check `get_board` to see what's available.

**Typical flow:** Developer agents (frontend, backend, etc.) move tasks to `review` when finished — not to the final column. Only the user or a dedicated test/QA agent should move tasks to the final column after verification. If the user explicitly asks you to mark it done, do it. Otherwise, default to `review` and let the human decide.

## Human Handoff

When you're blocked and need a human decision:

```
request_human(task_id, prompt="Need clarification on X vs Y approach")
```

This sets `needs_human=true` on the task. The human sees it flagged in the UI. Continue with other work while waiting.

## Labels

Labels categorize tasks (bug, feature, research, docs, chore, etc.). Projects come with default labels, and you can create custom ones. Use `manage_labels` with an `action` parameter:

### Listing labels
```
manage_labels(action="list")
```
Returns all labels in the project with slug, name, and color.

### Creating labels
```
manage_labels(action="create", name="Urgent", color="#EF4444")
```
Slug is auto-generated from name. Color defaults to `#6B7280`.

### Updating labels
```
manage_labels(action="update", label_id="<uuid>", name="New Name", color="#3B82F6")
```

### Deleting labels
```
manage_labels(action="delete", label_id="<uuid>")
```

### Reordering labels
```
manage_labels(action="reorder", label_ids=["uuid1", "uuid2", "uuid3"])
```

### Labeling tasks

- `create_task` with `labels` — assign label slugs during creation (e.g. `["bug", "frontend"]`)
- `update_task` with `labels` — replace all labels on a task (e.g. `["feature"]`)
- `list_tasks` with `label` filter — find all tasks with a specific label slug
- `get_task` returns `labels` array when labels are assigned

## Epics

Epics group related tasks together. Use them to organize work into features or milestones.

### Managing epics

- `list_epics` — see all epics in the project
- `create_epic` — create with name, optional description and color
- `update_epic` — rename, change description or color
- `delete_epic` — removes the epic and unlinks all tasks (tasks are NOT deleted)

### Linking tasks to epics

- `create_task` with `epic_id` — assign during creation
- `update_task` with `epic_id` — link existing task to an epic
- `update_task` with `epic_id: null` — unlink a task from its epic
- `list_tasks` with `epic` filter — find all tasks in an epic

### Epic workflow

When working on a feature epic:
1. `list_tasks` with `epic` filter to see all tasks in the epic
2. Pick highest-priority unblocked task
3. Move it and work as normal
4. When creating subtasks during work, assign them to the same epic with `epic_id`

## Releases

Releases group completed ("done") tasks into versioned snapshots. Released tasks are removed from the board. Deleting a release restores tasks to their original columns.

### Shipping a release

```
create_release(name="v0.3.0", task_ids=["uuid1", "uuid2"], description="Optional notes", board="main")
```

- Tasks must belong to the specified board and not already be in another release
- Tasks are removed from the board columns after release
- The `original_column_id` is stored so tasks can be restored on delete

### Listing releases

```
list_releases(board="main", limit=20)
```

Returns compact list: `{ releases: [{ id, name, tasks: 5, date: "2026-02-18" }] }`

### Getting release details

```
get_release(release_id="uuid")
```

Returns full release with task list.

### Release workflow

> **Every push to `main` should create a release.** Pushes to main trigger production deployment, so the release keeps the board, git history, and deploys in sync.

When pushing to main:
1. Ensure all shipped tasks are in the done column
2. `list_tasks` with `column="done"` to get task IDs for the tasks included in this push
3. `create_release` with a version name and those task IDs
4. Tasks disappear from the board — they're now part of the release history

## Trash (Soft Delete)

Tasks use soft delete — `delete_task` moves them to trash instead of permanently deleting. This is the safety net for agents that delete freely.

### Deleting tasks
```
delete_task(task_id="uuid")
```
Task is removed from the board but kept in the database with a `deleted_at` timestamp.

### Viewing trashed tasks
```
list_tasks(deleted=true)
```
Returns only soft-deleted tasks. Omit `deleted` (or set `false`) for normal active tasks.

### Restoring tasks
```
restore_task(task_id="uuid")
restore_task(task_id="uuid", column="backlog")  # restore to specific column
```
Restores a trashed task to the board. Defaults to original column (or first column if original was deleted).

### Notes
- `get_task` and `get_task_history` work on deleted tasks (agents can inspect trash)
- All other tools (`update_task`, `move_task`, `add_comment`, etc.) reject deleted tasks
- There is no permanent delete yet — trash accumulates

## Checklists

Tasks can have checklist items — lightweight sub-items for breaking down work steps. Use `manage_checklist` with a single `action` parameter:

### Adding items
```
manage_checklist(task_id, action="add", title="Implement DB schema")
manage_checklist(task_id, action="add", title="Write API routes", assigned_role="backend")
```

### Toggling completion
```
manage_checklist(task_id, action="toggle", item_id="<uuid>")
```

### Updating items
```
manage_checklist(task_id, action="update", item_id="<uuid>", title="New title")
manage_checklist(task_id, action="update", item_id="<uuid>", assigned_role=null)  # unassign
```

### Deleting items
```
manage_checklist(task_id, action="delete", item_id="<uuid>")
```

### Reordering items
```
manage_checklist(task_id, action="reorder", item_ids=["uuid1", "uuid2", "uuid3"])
```

All actions return `{ task_id, total, completed, items: [...] }`.

`get_task` includes a `checklist` array when items exist. `list_tasks` shows compact `checklist: "2/5"` progress.

## Dependencies

Tasks can depend on other tasks. A dependency means one task is **blocked by** another — it can't proceed until the blocker is resolved (moved to done). Use `manage_dependencies` with an `action` parameter:

### Adding dependencies
```
manage_dependencies(task_id, action="add", blocked_by_task_id="<uuid>")  # this task is blocked by another
manage_dependencies(task_id, action="add", blocks_task_id="<uuid>")      # this task blocks another
```

Specify either `blocked_by_task_id` OR `blocks_task_id` (not both). Both tasks must be in the same project. Cycles are rejected (A blocks B blocks A).

### Listing dependencies
```
manage_dependencies(task_id, action="list")
```

Returns `{ blocked_by: [...], blocks: [...] }` with task title and status for each linked task.

### Removing dependencies
```
manage_dependencies(task_id, action="remove", dependency_id="<uuid>")
```

### Dependency status

- A dependency is **resolved** when the blocking task reaches the `done` column
- `get_task` includes `blocked_by` and `blocks` arrays when dependencies exist
- `list_tasks` supports a `blocked` boolean filter (`true` = only blocked tasks, `false` = only unblocked)
- Board cards show a lock icon with count for blocked tasks

### Workflow tips

- Check dependencies before picking up a task — if it's blocked, work on something else
- When creating subtasks that must be done in order, add dependencies between them
- Use `list_tasks(blocked=true)` to find bottlenecks on the board

## Comments

Use `add_comment` to:
- Document decisions and progress
- Ask questions to other agents or humans
- Leave status updates when moving tasks

Use `list_comments` to read the conversation history on a task before adding your own.

Your agent role is automatically attached to each comment.

## Context Docs

Projects can store shared documentation accessible to all agents:

- `list_docs` — browse available docs, filter by `category` or `role`
- `get_doc` — read a specific doc by slug
- `get_role_context` — get all docs relevant to your role (general + role-specific)
- `update_doc` — update doc content (increments version)

Read your role context at the start of a session to understand project conventions.

## Error Recovery

Mistakes happen. Here's how to recover:

### Moved to wrong column
```
move_task(task_id, column="correct-column")
```
Just move it again. All moves are logged in `get_task_history`.

### Accidentally deleted a task
```
list_tasks(deleted=true)          # find it in trash
restore_task(task_id, column="todo")  # restore to any column
```

### Created a task in the wrong epic
```
update_task(task_id, epic_id="correct-epic-uuid")  # re-link
update_task(task_id, epic_id=null)                  # or unlink entirely
```

### Added wrong dependency
```
manage_dependencies(task_id, action="list")                    # find the dep_id
manage_dependencies(task_id, action="remove", dependency_id="dep-uuid")  # remove it
```

### Overwrote task description
Check `get_task_history(task_id)` — it logs description changes with before/after. Copy the old content and `update_task` to restore it.

## Performance Tips

For boards with many tasks, use filters to minimize token usage:

### Targeted queries
```
list_tasks(column="in-progress", role="backend")  # narrow scope
list_tasks(epic="uuid", blocked=false)             # unblocked in epic
list_tasks(label="bug", limit=5)                   # just a few
```

### Pagination for large result sets
```
list_tasks(limit=10, offset=0)   # first page
list_tasks(limit=10, offset=10)  # second page
```

### Prefer compact tools first
- `list_tasks` returns indexes (id, title, status, priority) — cheap
- `get_task` returns full details (description, comments, checklist) — heavier
- `get_board` returns the entire board — use only when you need the full picture

**Pattern:** `list_tasks` to scan, then `get_task` only for the task you'll work on.

## Session Pattern

Recommended workflow when starting a session:

1. `get_role_context` — load project docs for your role
2. `get_board` — see current board state
3. `list_tasks` with your `role` — find assigned work (optionally filter by `epic` too)
4. Pick highest-priority unblocked task (check `blocked` filter or dependency info)
5. `move_task` -> `in-progress`, do the work
6. `add_comment` with summary, `move_task` -> `review` (let user or QA agent mark done)

## Tool Reference

See [references/tools.md](references/tools.md) for full parameter details on all 32 tools and 3 resources.
