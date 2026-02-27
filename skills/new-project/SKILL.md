---
name: new-project
description: "Generate KanClaw backlog from conversation: epic, tasks, checklists, dependencies."
---

# /kanclaw:new-project -- Backlog Generator

Brainstorm scope with user, then batch-create epic + tasks + checklists + dependencies.

## Workflow: Brainstorm > Plan > Confirm > Create

### Phase 1: Brainstorm

Ask questions **one at a time** (3-6 typically enough). Stop when you can describe:
- Epic scope in 2-3 sentences, 4-12 tasks with clear boundaries, dependency chain, role assignments

**Areas to probe** (skip what's obvious): scope (v1 vs later), users/workflows, architecture (DB/API/UI changes), constraints, existing code, risks.

### Phase 2: Plan

Read board state first: `get_board()`, `list_epics()`, `list_roles()`.

Generate plan:
```markdown
## Epic: [Name]
[2-3 sentence scope]

### Tasks
1. **[Title]** (priority: high, role: backend)
   > [Context paragraph + requirements list]
   - [ ] [Verifiable DoD item]
   Depends on: --
```

**Task quality:**
- Senior-level granularity (1-4h focused work), self-contained with context + requirements
- Checklist items are code-verifiable assertions ("API returns 401 on invalid token" not "auth works")
- Dependencies only when task B literally cannot start without task A's output

### Phase 3: Confirm

Show plan, ask for approval. Iterate until confirmed.

### Phase 4: Create

1. `manage_epics(action="create", name, description)` > save epic_id
2. `create_task(title, description, priority, roles, epic_id, checklist=[...])` per task > save task_ids
3. `manage_dependencies(action="add", blocked_by_task_id=...)` after all tasks exist
4. Show summary: epic name, task count, checklist count, dependency count

## Rules

- Never create without confirmation
- Use `create_task(checklist=[...])` batch, not individual `manage_checklist` calls
- Read board first to avoid duplicates
- 4-12 tasks per epic; split if more needed
- Default to backlog column
- Assign roles from `list_roles()`
