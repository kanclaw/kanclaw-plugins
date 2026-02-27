---
name: kanclaw
description: "KanClaw AI Kanban via MCP. Use when managing tasks, coordinating agents, or shipping releases."
---

# KanClaw

AI Kanban board via MCP. API key = one project + optional agent role.

## Setup

MCP config in `.mcp.json`:
```json
{ "mcpServers": { "kanclaw": { "type": "http", "url": "https://mcp.kanclaw.com/mcp", "headers": { "Authorization": "Bearer YOUR_API_KEY" } } } }
```
Get API keys at **Project Settings** on kanclaw.com. Restart Claude Code after changes.

## Core Rules

**Columns:** `backlog` > `todo` > `in-progress` > `review` > `done` | **Priorities:** `critical` > `high` > `medium` > `low`

**Reading** (`get_task`, `list_tasks`) is always allowed -- never refuse or stop after reading a task.

**Implementing** (writing code) requires `move_task` to `in-progress` first -- this is a lock to prevent concurrent agent work.

**Planning:** move to `in-progress` > plan > `add_comment` with plan > implement.

**Picking up work:** `list_tasks(role=...)` > `get_task` > `move_task` to `in-progress` > work > `add_comment` summary > `move_task` to `review`.

Agents move to `review`, not `done`. Only user/QA moves to `done` unless explicitly asked.

## Creating Tasks

1. `list_epics` + `list_roles` first
2. `create_task` with title, description, priority, roles, labels, epic_id, checklist
3. `manage_dependencies(action="add")` for blocked_by/blocks relationships

## Key Tools

- **Move:** `move_task(task_id, column)` -- hyphens in slugs (`in-progress`). Invalid column returns `available_columns`.
- **Human handoff:** `request_human(task_id, prompt)` -- sets `needs_human=true`.
- **Labels:** `manage_labels(action=list|create|update|delete|reorder)`. Assign via `create_task(labels=[...])`.
- **Epics:** `manage_epics(action=list|create|update|delete)`. Link via `epic_id` on tasks.
- **Releases:** `manage_releases(action=list|get|create)`. Every push to `main` creates a release.
- **Dependencies:** `manage_dependencies(action=add|remove|list)`. BFS cycle detection.
- **Checklists:** `manage_checklist(action=add|add_many|toggle|update|delete|reorder)`. Batch with `create_task(checklist=[...])`.
- **Comments:** `manage_comments(action=add|list)`. Agent role auto-attached.
- **Trash:** `delete_task` (soft), `restore_task` to recover.
- **Docs:** `get_role_context` at session start. `list_docs`, `get_doc`, `create_doc`, `update_doc`, `append_to_doc`, `delete_doc`.
- **Board:** `get_board`, `manage_board(action=list|create|update|delete)`.

## Error Recovery

Wrong column > `move_task` again | Accidental delete > `restore_task` | Wrong epic > `update_task(epic_id=...)` | Wrong dep > `manage_dependencies(action=remove)` | Lost description > `get_task_history`

## Session Pattern

1. `get_role_context` 2. `get_board` 3. `list_tasks(role=...)` 4. Pick highest-priority unblocked 5. Lock > work > comment > review

## Performance

`list_tasks` (compact) before `get_task` (full). Use filters: `column`, `role`, `epic`, `label`, `blocked`, `limit`.

## Tool Reference

See [references/tools.md](references/tools.md) for full tool params and response shapes.
