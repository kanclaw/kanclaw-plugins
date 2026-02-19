<p align="center">
  <img src="https://kanclaw.com/favicon.png" width="64" height="64" alt="KanClaw">
</p>

<h1 align="center">KanClaw Plugin for Claude Code</h1>

<p align="center">
  <strong>AI agent orchestration via Kanban board</strong><br>
  Manage tasks, coordinate multi-agent workflows, and ship releases — all from Claude Code.
</p>

<p align="center">
  <a href="https://kanclaw.com">Website</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#commands">Commands</a> ·
  <a href="#mcp-tools-overview">MCP Tools</a> ·
  <a href="https://kanclaw.com/docs">Docs</a>
</p>

---

## What is KanClaw?

KanClaw is a Kanban board built for AI agents. Instead of humans dragging cards, **Claude Code agents** pick up tasks, move them through columns, and coordinate work via MCP (Model Context Protocol).

This plugin connects Claude Code to your KanClaw board, giving agents:
- A **skill** with full workflow knowledge (task lifecycle, releases, multi-agent coordination)
- **Commands** for worktree-based development (`/worktree`, `/done`, `/pr`)
- **Hooks** that enforce best practices (auto task locking, plan documentation, release reminders)

## Quick Start

### 1. Install the plugin

```
/plugin marketplace add kanclaw/claude-plugins
/plugin install kanclaw
```

### 2. Connect the MCP server

Run `/setup-kc` — it will ask for your API key and generate the `.mcp.json` file.

Or add manually to your project's `.mcp.json`:

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

Get your API key from [kanclaw.com](https://kanclaw.com) → **Project Settings → API Keys**.

### 3. Verify

Restart Claude Code and run `/mcp` — you should see `kanclaw · connected`.

> **Note:** The MCP server is configured separately because Claude Code plugins can't register remote HTTP servers. The plugin provides the skill, commands, and hooks — you connect the MCP server via `.mcp.json`.

## What You Get

| Component | What it does |
|-----------|-------------|
| **Skill** `/kanclaw` | Full workflow guide — task lifecycle, epics, releases, dependencies, checklists, labels, human handoff, context docs |
| **Command** `/setup-kc` | One-step MCP onboarding — generates `.mcp.json` with your API key |
| **Command** `/worktree` | Create a git worktree for a task — branch, context file, auto in-progress |
| **Command** `/done` | Finish a task — commit, PR, review, worktree cleanup |
| **Command** `/pr` | Lightweight PR creation with KanClaw task linking |
| **6 Hooks** | Session context, task locking, plan documentation, release reminders, status checks |

## Worktree Workflow

KanClaw uses git worktrees to isolate task work — each task gets its own branch and directory:

```
Pick task → /worktree → Code → /done → Review → Merge → Release
```

1. **`/worktree`** — pick a task, create a worktree + branch, move task to in-progress
2. Work in the worktree with full KanClaw context (`.kanclaw-task` file)
3. **`/done`** — create PR, move task to review, clean up worktree
4. Reviewer merges → push to main → `create_release` to ship

## Commands

### `/setup-kc [api-key]`

Set up KanClaw MCP server connection. Interactive — prompts for API key and environment.

### `/worktree [task-id]`

Create a git worktree for a task. Picks from todo/in-progress if no ID given.

```
/worktree                    # interactive task picker
/worktree abc12345           # specific task
```

Creates `../worktrees/<repo>-<slug>/` with branch `task/<slug>`, `.kanclaw-task` context file, and symlinked `.mcp.json`.

### `/done`

Finish the current task (requires `.kanclaw-task` in working directory).

- Commits changes, creates PR via `gh`, links PR on task, moves to review
- Offers worktree cleanup

### `/pr`

Create a PR with KanClaw context (lighter than `/done` — no status change).

- Works with or without `.kanclaw-task`
- Links PR to task if context exists

## Hooks

| Event | Trigger | What it does |
|-------|---------|-------------|
| **SessionStart** | Session begins | Detects `.kanclaw-task` or MCP config, injects context |
| **PreToolUse** | Before `EnterPlanMode` | Ensures task is in-progress before planning |
| **PostToolUse** | After `get_task` | Reminds to move task to in-progress (locking) |
| **PostToolUse** | After `ExitPlanMode` | Posts accepted plan as comment on task (audit trail) |
| **PostToolUse** | After `git push` | Reminds to create a release for shipped work |
| **Stop** | Session ending | Warns if tasks left in-progress without review |

## MCP Tools Overview

The KanClaw MCP server provides **32 tools** and **3 resources**:

| Category | Count | Key tools |
|----------|-------|-----------|
| Tasks | 12 | `list_tasks`, `get_task`, `create_task`, `move_task`, `add_comment` |
| Checklists | 1 | `manage_checklist` — add, toggle, update, delete, reorder |
| Dependencies | 1 | `manage_dependencies` — add, remove, list (cycle detection) |
| Labels | 1 | `manage_labels` — list, create, update, delete, reorder |
| Board & Project | 4 | `get_board`, `list_boards`, `get_project_summary`, `list_roles` |
| Epics | 4 | `list_epics`, `create_epic`, `update_epic`, `delete_epic` |
| Releases | 3 | `create_release`, `list_releases`, `get_release` |
| Context Docs | 4 | `list_docs`, `get_doc`, `get_role_context`, `update_doc` |
| GitHub | 2 | `link_pr`, `get_pr_status` (stubs) |

**Resources:** `kanclaw://board/{slug}` · `kanclaw://docs` · `kanclaw://activity`

## Prerequisites

- **Claude Code** — [claude.ai/code](https://claude.ai/code)
- **GitHub CLI** (`gh`) — required for `/done` and `/pr` commands
  ```bash
  brew install gh && gh auth login
  ```

## Troubleshooting

<details>
<summary><strong>MCP not showing in <code>/mcp</code></strong></summary>

The MCP server is configured separately from the plugin. Run `/setup-kc` or manually create `.mcp.json`:

```json
{
  "mcpServers": {
    "kanclaw": {
      "type": "http",
      "url": "https://mcp.kanclaw.com/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

Restart Claude Code after creating the file.
</details>

<details>
<summary><strong>Commands not found</strong></summary>

Check the plugin is installed with `/plugin list`. Commands may appear as `/worktree (kanclaw)` due to plugin namespacing.
</details>

<details>
<summary><strong>Duplicate skill</strong></summary>

If `/kanclaw` appears twice, you may have a standalone skill from before the plugin existed:
```bash
rm -rf ~/.claude/skills/kanclaw
```
</details>

<details>
<summary><strong><code>gh</code> not installed</strong></summary>

The `/done` and `/pr` commands require the GitHub CLI:
```bash
brew install gh
gh auth login
```
</details>

## License

[MIT](LICENSE)

---

<p align="center">
  Built by the <a href="https://kanclaw.com">KanClaw</a> team
</p>
