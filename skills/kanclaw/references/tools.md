# KanClaw MCP Tools Reference (32 tools, 3 resources)

All responses are compact to minimize token usage. Lists return indexes (enough to identify, not full data). Mutations return confirmations (ID + what changed). Use detail tools (`get_task`, `get_doc`) for full data.

## Task Tools

### list_tasks
List tasks with optional filters. Returns compact index.
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| board | string | "main" | Board slug |
| column | string | — | Column slug filter |
| status | string | — | Status filter (= column slug) |
| role | string | — | Agent role slug filter |
| epic | string | — | Epic ID filter |
| needs_human | boolean | — | Filter flagged tasks |
| label | string | — | Label slug filter |
| blocked | boolean | — | true = only blocked tasks, false = only unblocked |
| deleted | boolean | false | true = only trashed tasks, false/omitted = active tasks |
| limit | number | 50 | Max results |
| offset | number | 0 | Pagination offset |

**Response:**
```json
{ "tasks": [{ "id": "uuid", "title": "Title", "status": "backlog", "priority": "high", "roles": ["backend"], "labels": ["bug"] }], "total": 12 }
```
`needs_human`, `roles`, and `labels` only appear when truthy/non-empty.

### get_task
Get full task details (description, comments, roles).
| Param | Type | Required |
|-------|------|----------|
| task_id | string | yes |

**Response:**
```json
{
  "id": "uuid", "title": "Title", "description": "Full markdown...",
  "status": "in-progress", "priority": "high",
  "comments": [{ "id": "uuid", "by": "agent:backend", "content": "Full content", "date": "2026-02-18" }],
  "roles": ["backend", "frontend"]
}
```
Optional fields (`needs_human`, `human_prompt`, `epic_id`, `labels`, `github_issue_number`, `github_pr_number`, `blocked_by`, `blocks`) only appear when set. Comments use `by` field: `"agent:<role>"` for agents, `"username"` for humans.

`blocked_by` and `blocks` are arrays of `{ dep_id, task_id, title, status }` showing dependency relationships.

### create_task
Create a new task. **Best practice:** Call `list_epics` first and assign an `epic_id` when the task relates to an existing feature or effort. Create a new epic if needed. Only skip for truly isolated one-off tasks.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| title | string | — | **Required.** Task title |
| description | string | "" | Markdown description |
| column | string | "backlog" | Target column slug |
| board | string | "main" | Target board slug |
| priority | string | "medium" | critical/high/medium/low |
| roles | string[] | — | Agent role slugs to assign |
| labels | string[] | — | Label slugs to assign (e.g. `["bug", "frontend"]`) |
| epic_id | string | — | Epic UUID — **almost always set this** |

**Response:**
```json
{ "id": "uuid", "title": "Title", "status": "backlog", "priority": "medium" }
```

### update_task
Update task fields. Use `move_task` to change column. All changes are logged to activity history.
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| task_id | string | yes | Task UUID |
| title | string | no | New title |
| description | string | no | New description |
| priority | string | no | New priority |
| epic_id | string\|null | no | Epic UUID (null to unlink) |
| roles | string[] | no | Replaces all assigned roles |
| labels | string[] | no | Replaces all assigned labels (slugs) |
| confirm_overwrite | boolean | no | Set true to confirm a large description reduction |

**Description diff validation:** If the new description is >50% shorter than the existing (and existing is >100 chars), returns a warning. Set `confirm_overwrite: true` to proceed.

**Response:**
```json
{ "id": "uuid", "updated": ["title", "priority"] }
```

### move_task
Move task to a different column.
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| task_id | string | yes | Task UUID |
| column | string | yes | Target column slug (hyphens: `in-progress`) |
| position | number | no | Position in column (default: bottom) |
| board | string | no | Target board slug (cross-board moves) |

**Response:**
```json
{ "id": "uuid", "status": "in-progress" }
```
On invalid column, returns `available_columns` list for self-correction.

### add_comment
Add a markdown comment. Agent role auto-attached.
| Param | Type | Required |
|-------|------|----------|
| task_id | string | yes |
| content | string | yes |

**Response:**
```json
{ "id": "uuid", "task_id": "uuid" }
```

### list_comments
List comments for a task (newest last, chronological).
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| task_id | string | — | **Required.** Task UUID |
| limit | number | 10 | Max comments (0 = all) |
| offset | number | 0 | Skip first N comments |

**Response:**
```json
{ "comments": [{ "id": "uuid", "by": "agent:backend", "content": "First 80 chars...", "date": "2026-02-18" }], "total": 5 }
```
Content is truncated to 80 chars. Use `get_task` for full comment content.

### request_human
Flag task as needing human input.
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| task_id | string | yes | Task UUID |
| prompt | string | yes | What you need from the human |

**Response:**
```json
{ "id": "uuid", "needs_human": true, "prompt": "The prompt you set" }
```

### assign_role
Add or remove an agent role from a task.
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| task_id | string | yes | Task UUID |
| role | string | yes | Agent role slug |
| action | string | no | "add" (default) or "remove" |

**Response:**
```json
{ "id": "uuid", "roles": ["backend", "frontend"] }
```
Returns current role list after the change.

### get_task_history
Get change history for a task (audit log of all mutations).
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| task_id | string | yes | Task UUID |
| limit | number | no | Max entries (default: 20) |

**Response:**
```json
{ "task_id": "uuid", "history": [{ "action": "task.updated", "by": "agent:backend", "date": "2026-02-18 21:30", "details": { "changes": { "priority": { "from": "medium", "to": "high" } } } }] }
```

### delete_task
Soft-delete a task (moves to trash). Task can be restored later.
| Param | Type | Required |
|-------|------|----------|
| task_id | string | yes |

**Response:**
```json
{ "id": "uuid", "deleted": true }
```
Task is removed from the board but kept in the database. Use `list_tasks` with `deleted: true` to see trashed tasks. Use `restore_task` to bring it back.

### restore_task
Restore a soft-deleted task from trash back to the board.
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| task_id | string | yes | Task UUID |
| column | string | no | Target column slug (defaults to original column, or first column if original was deleted) |

**Response:**
```json
{ "id": "uuid", "status": "backlog", "restored": true }
```

## Checklist Tools

### manage_checklist
Single tool for all checklist operations within a task.
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| task_id | string | yes | Task UUID |
| action | string | yes | "add", "toggle", "update", "delete", or "reorder" |
| title | string | for add/update | Item title |
| item_id | string | for toggle/update/delete | Checklist item UUID |
| assigned_role | string\|null | no | Agent role slug (null to unassign) |
| item_ids | string[] | for reorder | Ordered array of item UUIDs |

**Response:**
```json
{
  "task_id": "uuid", "total": 5, "completed": 2,
  "items": [{ "id": "uuid", "title": "Title", "completed": true, "position": 0, "assigned_role": "backend" }]
}
```
`assigned_role` only appears on items when set.

**Notes:**
- `get_task` includes a `checklist` array when items exist
- `list_tasks` shows compact `checklist: "2/5"` progress when items exist

## Dependency Tools

### manage_dependencies
Manage task dependencies (blocked-by / blocks). Actions: add, remove, list.
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| task_id | string | yes | Task UUID |
| action | string | yes | "add", "remove", or "list" |
| blocks_task_id | string | for add | Task UUID that this task blocks |
| blocked_by_task_id | string | for add | Task UUID that blocks this task |
| dependency_id | string | for remove | Dependency UUID |

**Add:** Specify either `blocks_task_id` OR `blocked_by_task_id`. Validates same-project, detects cycles via BFS.

**Response (add):**
```json
{ "id": "dep-uuid", "blocking": "task-a-uuid", "blocked": "task-b-uuid" }
```

**Response (list):**
```json
{
  "blocked_by": [{ "dep_id": "uuid", "task_id": "uuid", "title": "Title", "status": "backlog" }],
  "blocks": [{ "dep_id": "uuid", "task_id": "uuid", "title": "Title", "status": "in-progress" }]
}
```

**Response (remove):**
```json
{ "deleted": true }
```

**Notes:**
- `get_task` includes `blocked_by` and `blocks` arrays when dependencies exist
- `list_tasks` supports a `blocked` boolean filter (true = only blocked tasks)
- Board cards show a lock icon with count for blocked tasks
- "Resolved" means the blocking task is in the `done` column

## Label Tools

### manage_labels
Single tool for all label operations within a project. Actions: list, create, update, delete, reorder.
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| action | string | yes | "list", "create", "update", "delete", or "reorder" |
| name | string | for create | Label name (slug auto-generated) |
| color | string | no | Hex color (default: "#6B7280") |
| label_id | string | for update/delete | Label UUID |
| label_ids | string[] | for reorder | Ordered array of label UUIDs |

**Response (list):**
```json
{ "labels": [{ "id": "uuid", "slug": "bug", "name": "Bug", "color": "#EF4444", "position": 0 }] }
```

**Response (create):**
```json
{ "id": "uuid", "slug": "bug", "name": "Bug", "color": "#EF4444" }
```

**Response (update):**
```json
{ "id": "uuid", "updated": ["name", "color"] }
```

**Response (delete):**
```json
{ "deleted": true }
```

**Response (reorder):**
```json
{ "reordered": true }
```

**Notes:**
- Default labels (Bug, Task) are created with each project
- Labels are project-scoped — each project has its own set
- Use label slugs in `create_task` and `update_task` to assign labels to tasks
- Use `label` filter in `list_tasks` to find tasks by label

## Board & Project Tools

### get_board
Compact board overview with columns and tasks.
| Param | Type | Default |
|-------|------|---------|
| board | string | "main" |

**Response:**
```json
{
  "name": "Main", "slug": "main",
  "columns": [{
    "name": "Backlog", "slug": "backlog",
    "tasks": [{ "id": "uuid", "title": "Title", "priority": "high", "roles": ["backend"] }]
  }]
}
```
Tasks only include `id`, `title`, `priority`, plus `needs_human` and `roles` when set.

### list_boards
List all boards in the project. No params.

**Response:**
```json
[{ "slug": "main", "name": "Main", "default": true }]
```
`default` only appears on the default board.

### get_project_summary
Project stats overview. No params.

**Response:**
```json
{
  "name": "Project Name", "boards": 1,
  "tasks": { "backlog": 3, "in-progress": 2, "done": 8 },
  "roles": { "backend": 4, "frontend": 3 }
}
```

### list_roles
List all agent roles in the project. **Call this before `create_task`** to find the right role(s) to assign.

No params.

**Response:**
```json
[{ "slug": "frontend", "name": "Frontend", "description": "UI components and pages" }]
```
`description` only appears when set.

## Epic Tools

### list_epics
List all epics in the project. No params.

**Response:**
```json
[{ "id": "uuid", "name": "Epic Name", "color": "#6B7280" }]
```

### create_epic
Create a new epic.
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | — | **Required.** Epic name |
| description | string | "" | Markdown description |
| color | string | "#6B7280" | Hex color for UI display |

**Response:**
```json
{ "id": "uuid", "name": "Epic Name" }
```

### update_epic
Update an epic.
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| epic_id | string | yes | Epic UUID |
| name | string | no | New name |
| description | string | no | New description |
| color | string | no | New hex color |

**Response:**
```json
{ "id": "uuid", "updated": ["name", "color"] }
```

### delete_epic
Delete an epic (unlinks all associated tasks).
| Param | Type | Required |
|-------|------|----------|
| epic_id | string | yes |

**Response:**
```json
{ "deleted": true }
```

## Release Tools

### create_release
Create a versioned release from done tasks. Released tasks are removed from the board.
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Release name (e.g. "v0.3.0") |
| task_ids | string[] | yes | Task UUIDs to include |
| description | string | no | Release description |
| board | string | no | Board slug (default: "main") |

**Response:**
```json
{ "id": "uuid", "name": "v0.3.0", "tasks": 5 }
```
Rejects if tasks are not on the board or already in another release.

### list_releases
List releases with task counts.
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| board | string | — | Board slug filter |
| limit | number | 20 | Max results |

**Response:**
```json
{ "releases": [{ "id": "uuid", "name": "v0.3.0", "tasks": 5, "date": "2026-02-18" }] }
```

### get_release
Get release details with task list.
| Param | Type | Required |
|-------|------|----------|
| release_id | string | yes |

**Response:**
```json
{
  "id": "uuid", "name": "v0.3.0", "description": "...", "created_at": "...",
  "tasks": [{ "id": "uuid", "title": "Title", "priority": "high" }]
}
```

## Context Doc Tools

### list_docs
List docs, optionally filtered.
| Param | Type | Description |
|-------|------|-------------|
| category | string | Filter by category |
| role | string | Filter docs relevant to role |

**Response:**
```json
[{ "slug": "getting-started", "title": "Getting Started", "category": "general" }]
```

### get_doc
Get a specific doc with full content.
| Param | Type | Required |
|-------|------|----------|
| slug | string | yes |

**Response:**
```json
{ "slug": "getting-started", "title": "Getting Started", "content": "Full markdown...", "category": "general" }
```

### get_role_context
Get all docs for a role (general + role-specific). Returns full content.
| Param | Type | Default |
|-------|------|---------|
| role | string | API key's role |

**Response:** Array of doc objects (same shape as `get_doc`).

### update_doc
Update doc content or title. Auto-increments version.
| Param | Type | Required |
|-------|------|----------|
| slug | string | yes |
| title | string | no |
| content | string | no |

**Response:**
```json
{ "slug": "getting-started", "version": 2 }
```

## GitHub Integration Tools (stubs)

### link_pr
Link a GitHub PR to a task. **Not yet implemented.**
| Param | Type | Required |
|-------|------|----------|
| task_id | string | yes |
| pr_number | number | yes |

### get_pr_status
Check the GitHub PR status linked to a task. **Not yet implemented.**
| Param | Type | Required |
|-------|------|----------|
| task_id | string | yes |

## MCP Resources

Resources provide read-only data via the MCP resource protocol. Access them with your MCP client's resource reading capability.

### kanclaw://board/{board_slug}
Full board snapshot including all columns and tasks. Equivalent to `get_board` but accessed as a resource.

**URI pattern:** `kanclaw://board/main`

### kanclaw://docs
List of all context documents in the project. Returns doc slugs, titles, and categories.

**URI:** `kanclaw://docs`

### kanclaw://activity
Recent activity feed for the project. Shows task mutations, comments, and status changes.

**URI:** `kanclaw://activity`
