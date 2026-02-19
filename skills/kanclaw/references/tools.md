# KanClaw MCP Tools (37 tools, 3 resources)

Responses are compact: lists return indexes, mutations return confirmations. Use `get_task`/`get_doc` for full data.

## Tasks (12 tools)

**list_tasks**(board?, column?, status?, role?, epic?, label?, needs_human?, blocked?, deleted?, limit=50, offset=0) → `{ tasks: [{ id, title, status, priority, roles?, labels?, needs_human?, checklist? }], total }`

**get_task**(task_id) → `{ id, title, description, status, priority, comments, roles, labels?, epic_id?, needs_human?, human_prompt?, blocked_by?, blocks?, checklist? }`
Comments: `{ id, by: "agent:<role>"|"username", content, date }`. Deps: `{ dep_id, task_id, title, status }`.

**create_task**(title, description?, column="backlog", board="main", priority="medium", roles?, labels?, epic_id?) → `{ id, title, status, priority }`

**update_task**(task_id, title?, description?, priority?, epic_id?, roles?, labels?, confirm_overwrite?) → `{ id, updated: [...] }`
Does NOT change column — use `move_task`. Description >50% shorter triggers warning; set `confirm_overwrite: true`.

**move_task**(task_id, column, position?, board?) → `{ id, status }`. On invalid column returns `available_columns`.

**add_comment**(task_id, content) → `{ id, task_id }`. Agent role auto-attached.

**list_comments**(task_id, limit=10, offset=0) → `{ comments: [{ id, by, content(80ch), date }], total }`

**request_human**(task_id, prompt) → `{ id, needs_human: true, prompt }`

**assign_role**(task_id, role, action="add"|"remove") → `{ id, roles: [...] }`

**get_task_history**(task_id, limit=20) → `{ task_id, history: [{ action, by, date, details }] }`

**delete_task**(task_id) → `{ id, deleted: true }`. Soft-delete (trash). Use `list_tasks(deleted=true)` to view.

**restore_task**(task_id, column?) → `{ id, status, restored: true }`. Restores from trash.

## Checklists (1 tool)

**manage_checklist**(task_id, action, title?, item_id?, assigned_role?, item_ids?)
Actions: `add`(title), `toggle`(item_id), `update`(item_id, title?, assigned_role?), `delete`(item_id), `reorder`(item_ids)
→ `{ task_id, total, completed, items: [{ id, title, completed, position, assigned_role? }] }`

## Dependencies (1 tool)

**manage_dependencies**(task_id, action, blocked_by_task_id?, blocks_task_id?, dependency_id?)
Actions: `add`(blocked_by_task_id OR blocks_task_id), `remove`(dependency_id), `list`
Add validates same-project + BFS cycle detection.
→ add: `{ id, blocking, blocked }` | list: `{ blocked_by: [...], blocks: [...] }` | remove: `{ deleted: true }`

## Labels (1 tool)

**manage_labels**(action, name?, color="#6B7280", label_id?, slug?, label_ids?)
Actions: `list`, `create`(name), `update`(label_id, name?, color?), `delete`(label_id), `reorder`(label_ids)
→ list: `{ labels: [{ id, slug, name, color, position }] }` | create: `{ id, slug, name, color }`

## Board & Project (4 tools)

**get_board**(board="main") → `{ name, slug, columns: [{ name, slug, tasks: [{ id, title, priority, roles?, needs_human? }] }] }`

**list_boards**() → `[{ slug, name, default? }]`

**get_project_summary**() → `{ name, boards, tasks: { column: count }, roles: { role: count } }`

**list_roles**() → `[{ slug, name, description? }]`. Call before `create_task` to find correct roles.

## Epics (4 tools)

**list_epics**() → `[{ id, name, color }]`

**create_epic**(name, description?, color="#6B7280") → `{ id, name }`

**update_epic**(epic_id, name?, description?, color?) → `{ id, updated: [...] }`

**delete_epic**(epic_id) → `{ deleted: true }`. Unlinks tasks (doesn't delete them).

## Releases (3 tools)

**create_release**(name, task_ids, description?, board="main") → `{ id, name, tasks: count }`. Tasks removed from board.

**list_releases**(board?, limit=20) → `{ releases: [{ id, name, tasks, date }] }`

**get_release**(release_id) → `{ id, name, description, created_at, tasks: [...] }`

## Context Docs (4 tools)

**list_docs**(category?, role?) → `[{ slug, title, category }]`

**get_doc**(slug) → `{ slug, title, content, category }`

**get_role_context**(role?) → Array of doc objects. Defaults to API key's role.

**update_doc**(slug, title?, content?) → `{ slug, version }`

## Workflow (5 tools)

**claim_task**(task_id, board?) → `{ id, title, status, agent_locked_by }`. Atomic lock + move to `in-progress`. Idempotent re-claim. Rejects if: already claimed by another, blocked, deleted.

**release_task**(task_id, column="review", summary?) → `{ id, title, status }`. Clear lock + move to target column. Optional `summary` added as comment.

**get_next_task**(board?, role?, column?) → `{ task: { id, title, priority, status } | null }`. Smart picker: unblocked, unclaimed, priority ordering (critical>high>medium>low), prefers todo>backlog. Does NOT auto-claim.

**set_branch**(task_id, branch_name) → `{ id, branch_name }`. Record git branch name on a task.

**get_workflow_status**(board?) → `{ active_tasks: [{ id, title, locked_by, locked_at, branch }], workflow_runs: [{ id, status, mode, started_at, stats }] }`

## GitHub (2 stubs — not yet implemented)

**link_pr**(task_id, pr_number) | **get_pr_status**(task_id)

## Resources (3)

`kanclaw://board/{slug}` — Board snapshot | `kanclaw://docs` — Doc list | `kanclaw://activity` — Recent activity
