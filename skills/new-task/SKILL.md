---
name: new-task
description: "Create a single KanClaw task with description, DoD checklist, and dependencies."
---

# /kanclaw:new-task -- Single Task Generator

One well-specified task with description, DoD checklist, dependencies, and role assignment.

## Workflow: Understand > Context > Spec > Confirm > Create

### Phase 1: Understand

Ask **1-3 clarifying questions** max. If request is clear, skip to Phase 2.

### Phase 2: Context

Silently gather: `get_board()`, `list_epics()`, `list_roles()`. Read relevant code if modifying existing functionality.

### Phase 3: Spec

Present to user:
```markdown
## Task: [Title]
**Priority:** high | **Role:** backend | **Epic:** [name]

### Description
**Context:** [Why, what it connects to]
**Requirements:** [Concrete list]

### Definition of Done
- [ ] [Verifiable item -- specific: file paths, error codes, UI states]

### Dependencies
- Blocked by / Blocks: [task title] (if any)
```

Checklist items must be code-verifiable assertions. Good: "API returns 400 on invalid token". Bad: "auth works".

### Phase 4: Confirm

Show spec, wait for explicit approval.

### Phase 5: Create

1. `create_task(title, description, priority, roles, epic_id, checklist=[...])` > save task_id
2. `manage_dependencies(action="add", blocked_by_task_id=...)` if needed
3. Confirm: task title, column, checklist count

## Rules

- Never create without confirmation
- Use `create_task(checklist=[...])` batch, not individual `manage_checklist` calls
- Read board first for epic/duplicate context
- One task per invocation; use `/kanclaw:new-project` for multiple
- Default to backlog column
