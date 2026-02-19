---
name: kanclaw
description: "KanClaw — AI-native Kanban board via MCP. Activates at session start when working on tasks from a KanClaw board. Use this skill when working on any project that uses KanClaw for task management. Guides task lifecycle (create, move, complete), epic management, labels, releases, checklists, agent coordination, human handoff, comments, and context docs. Activate when: interacting with KanClaw MCP tools, managing tasks on a board, coordinating with other agents, requesting human input, or shipping releases."
---

# KanClaw

Kanban board for AI agent orchestration via MCP. Each API key is scoped to one project + optional agent role.

## Setup

MCP must be configured. Run `/setup-kc` or create `.mcp.json`:
```json
{ "mcpServers": { "kanclaw": { "type": "http", "url": "https://mcp.kanclaw.com/mcp", "headers": { "Authorization": "Bearer YOUR_API_KEY" } } } }
```
API keys: **Project Settings → API Keys** at kanclaw.com. Restart Claude Code after writing `.mcp.json`.

## Core Rules

**Columns:** `backlog` → `todo` → `in-progress` → `review` → `done` | **Priorities:** `critical` > `high` > `medium` > `low`

### CRITICAL: move_task FIRST, work SECOND
The moment you decide to work on a task, `move_task` to `in-progress` BEFORE any analysis, planning, research, or code changes. No exceptions. This is a locking mechanism — without it, another agent can pick the same task.

**If you realize you started work without moving the task, STOP immediately, move it, then continue.**

### Planning protocol
1. `move_task` to `in-progress` FIRST — before entering plan mode
2. Enter plan mode, explore codebase, write plan
3. On plan acceptance → `add_comment` the full plan on the task (mandatory)
4. Begin implementation

### Picking up work
1. `list_tasks(role=...)` — find tasks for your role
2. `get_task` — read full description + comments
3. `move_task` → `in-progress` IMMEDIATELY
4. Work on the task
5. `add_comment` with summary → `move_task` → `review`

Developer agents move to `review`, not `done`. Only user/QA moves to `done` — unless user explicitly asks.

## Creating Tasks

**Always check epics and roles first:**
1. `list_epics` → find matching epic or `create_epic` if needed. Skip only for isolated one-offs.
2. `list_roles` → assign correct role(s).

**Always wire dependencies after creation:**
1. `create_task` with title, description, priority, roles, labels, epic_id
2. Immediately `manage_dependencies(action="add")` for any blocked_by/blocks relationships
3. When creating multiple related tasks, establish the full dependency chain before moving on

## Moving & Completing

`move_task(task_id, column)` — column slugs use hyphens (`in-progress`). On invalid column, response includes `available_columns`.

No `complete_task` shortcut — use `move_task` to the final column. Check `get_board` for available columns.

## Human Handoff

`request_human(task_id, prompt="Need clarification on X")` — sets `needs_human=true`. Continue other work while waiting.

## Labels

`manage_labels(action=...)` — list, create(name, color?), update(label_id), delete(label_id), reorder(label_ids).
Assign via `create_task(labels=[...])` or `update_task(labels=[...])`. Filter: `list_tasks(label="slug")`.

## Epics

Group related tasks. `list_epics`, `create_epic`, `update_epic`, `delete_epic` (unlinks tasks, doesn't delete them).
Link: `create_task(epic_id=...)` or `update_task(epic_id=...)`. Unlink: `update_task(epic_id=null)`.

## Releases

> **Every push to `main` creates a release.** Keeps board, git, and deploys in sync.

`create_release(name, task_ids)` — groups done tasks into versioned snapshot, removes from board.
`list_releases`, `get_release` for history.

## Dependencies

`manage_dependencies(action=...)` — add(blocked_by_task_id OR blocks_task_id), remove(dependency_id), list.
Blocked = can't proceed until blocker reaches `done`. Cycles rejected via BFS.
Filter: `list_tasks(blocked=true)` for bottlenecks. Check deps before picking up work.

## Checklists

`manage_checklist(action=...)` — add(title), toggle(item_id), update, delete, reorder.
Progress shown in `list_tasks` as `checklist: "2/5"`.

## Trash

`delete_task` = soft-delete. `list_tasks(deleted=true)` to view. `restore_task` to recover.

## Comments

`add_comment` for decisions, progress, questions. `list_comments` for history. Agent role auto-attached.

## Context Docs

`get_role_context` — load your role's docs at session start.
`list_docs`, `get_doc`, `update_doc` for project documentation.

## Error Recovery

- Wrong column → `move_task` again
- Accidental delete → `list_tasks(deleted=true)` + `restore_task`
- Wrong epic → `update_task(epic_id=correct)` or `epic_id=null`
- Wrong dependency → `manage_dependencies(action="list")` + `action="remove"`
- Overwritten description → check `get_task_history`

## Session Pattern

1. `get_role_context` — load project docs
2. `get_board` — see board state
3. `list_tasks(role=...)` — find your work
4. Pick highest-priority unblocked task
5. `move_task` → `in-progress`, work, `add_comment`, `move_task` → `review`

## Performance

- `list_tasks` (compact) before `get_task` (full) — scan then drill down
- Use filters: `column`, `role`, `epic`, `label`, `blocked`, `limit`
- `get_board` = entire board — use only when needed

## Tool Reference

See [references/tools.md](references/tools.md) for all 37 tools + 3 resources with params and response shapes.
