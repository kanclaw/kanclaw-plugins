# KanClaw MCP Tools + Resources

Responses are compact: lists return indexes, mutations return confirmations. Use `get_task`/`get_doc` for full data.

## Tasks (10 tools)

**list_tasks**(board?, column?, status?, role?, epic?, label?, needs_human?, blocked?, deleted?, limit=50, offset=0) -> `{ tasks: [{id, title, status, priority, position, column, roles?, labels?, needs_human?, checklist?}], total }`

**get_task**(task_id) -> `{ id, title, description, status, priority, comments, roles, labels?, epic_id?, needs_human?, human_prompt?, blocked_by?, blocks?, checklist?, branch_name? }`

**create_task**(title, description?, column="backlog", board="main", priority="medium", roles?, labels?, epic_id?, checklist?) -> `{ id, title, status, priority, checklist? }`

**update_task**(task_id, title?, description?, priority?, epic_id?, roles?, labels?, branch_name?, confirm_overwrite?) -> `{ id, updated: [...] }`
Does NOT change column (use `move_task`). Description >50% shorter triggers warning; set `confirm_overwrite: true`.

**move_task**(task_id, column, position?, board?) -> `{ id, status }`. On invalid column returns `available_columns`.

**request_human**(task_id, prompt) -> `{ id, needs_human: true, prompt }`

**assign_role**(task_id, role, action="add"|"remove") -> `{ id, roles: [...] }`

**get_task_history**(task_id, limit=20) -> `{ task_id, history: [{ action, by, date, details }] }`

**delete_task**(task_id) -> `{ id, deleted: true }`. Soft-delete.

**restore_task**(task_id, column?) -> `{ id, status, restored: true }`

## Checklists (1 tool)

**manage_checklist**(task_id, action, title?, items?, item_id?, assigned_role?, item_ids?)
Actions: `add`(title), `add_many`(items), `toggle`(item_id), `update`(item_id, title?, assigned_role?), `delete`(item_id), `reorder`(item_ids)

## Dependencies (1 tool)

**manage_dependencies**(task_id, action, blocked_by_task_id?, blocks_task_id?, dependency_id?)
Actions: `add`(blocked_by_task_id OR blocks_task_id), `remove`(dependency_id), `list`. BFS cycle detection.

## Labels (1 tool)

**manage_labels**(action, name?, color?, label_id?, slug?, label_ids?)
Actions: `list`, `create`(name), `update`(label_id), `delete`(label_id), `reorder`(label_ids)

## Board & Project (3 tools)

**get_board**(board="main") -> `{ name, slug, columns: [{ name, slug, tasks: [{id, title, priority, roles?, needs_human?}] }] }`

**manage_board**(action, name?, slug?, template?, columns?, role_defaults?, board?, is_default?)
Actions: `list` -> `[{slug, name, default?}]`, `create`(name, slug, template?, columns?, role_defaults?), `update`(board, name?, is_default?), `delete`(board)

**get_project_summary**() -> `{ name, boards, tasks: {column: count}, roles: {role: count} }`

## Epics (1 tool)

**manage_epics**(action, name?, description?, color?, epic_id?)
Actions: `list`, `create`(name), `update`(epic_id), `delete`(epic_id -- unlinks tasks)

## Releases (1 tool)

**manage_releases**(action, name?, task_ids?, description?, board?, release_id?, limit?)
Actions: `list`(board?, limit?), `get`(release_id), `create`(name, task_ids, description?, board?)

## Comments (1 tool)

**manage_comments**(task_id, action, content?, limit?, offset?)
Actions: `add`(content), `list`(limit?, offset?). Agent role auto-attached.

## Context Docs (7 tools)

**list_docs**(category?, role?) | **get_doc**(slug) | **get_role_context**(role?) | **create_doc**(slug, title, content?, category?, target_roles?) | **update_doc**(slug, title?, content?) | **append_to_doc**(slug, content) | **delete_doc**(slug)

## Workflow (4 tools)

**claim_task**(task_id, board?) -> Atomic lock + move to `in-progress`. Rejects if claimed/blocked/deleted.

**release_task**(task_id, column="review", summary?) -> Clear lock + move. Optional summary comment.

**get_next_task**(board?, role?, column?) -> Smart picker: unblocked, unclaimed, priority-ordered. Does NOT auto-claim.

**get_workflow_status**(board?) -> Active tasks + workflow runs.

## Roles (1 tool)

**list_roles**() -> `[{ slug, name, description?, has_prompt? }]`

## Resources (3)

`kanclaw://board/{slug}` | `kanclaw://docs` | `kanclaw://activity`
