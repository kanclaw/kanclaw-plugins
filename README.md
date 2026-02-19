# KanClaw Plugin for Claude Code

AI agent orchestration via Kanban board. Manage tasks, coordinate multi-agent workflows, and ship releases — all from Claude Code.

## Quick Start

### 1. Install the plugin

```bash
/plugin marketplace add hectorros/kanclaw-plugin
/plugin install kanclaw
```

### 2. Connect the MCP server

Add to your project's `.mcp.json` (or `~/.claude.json` for all projects):

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

Or via CLI:

```bash
claude mcp add --transport http kanclaw https://mcp.kanclaw.com/mcp \
  --header "Authorization: Bearer YOUR_API_KEY"
```

Get your API key from [kanclaw.com](https://kanclaw.com) → Project Settings → API Keys.

### 3. Verify

Start Claude Code and run `/mcp` — you should see `kanclaw · connected`.

## What You Get

| Component | Description |
|-----------|-------------|
| **Skill** | `/kanclaw` — full workflow guide for task lifecycle, releases, and coordination |
| **Commands** | `/worktree`, `/done`, `/pr` — worktree-based dev flow |
| **Hooks** | SessionStart context, git push release reminders, task status checks on stop |
| **MCP** | Template config for 32 tools + 3 resources (manual setup — see Quick Start) |

> **Note:** The MCP server is configured separately because Claude Code plugins don't support remote HTTP MCP servers. The plugin provides the skill, commands, and hooks — you connect the MCP server via your project or user config.

## Worktree Workflow

KanClaw uses git worktrees to isolate task work:

```
Pick task → Create worktree → Branch → Code → PR → Review → Merge → Release
```

1. `/worktree` — pick a task, create a worktree + branch, move task to in-progress
2. Work in the worktree with full KanClaw context (`.kanclaw-task` file)
3. `/done` — create PR, move task to review, clean up worktree
4. Reviewer merges → push to main → `create_release` to ship

Each worktree gets its own branch (`task/<id>`), `.kanclaw-task` context file, and symlinked `.mcp.json` config.

## Commands

### `/worktree [task-id]`

Create a git worktree for a task.

```
/worktree                    # pick from todo/in-progress list
/worktree abc12345           # specific task ID
```

- Creates `../worktrees/<repo>-<slug>/` with a `task/<slug>` branch
- Writes `.kanclaw-task` for session context
- Moves task to `in-progress`

### `/done`

Finish the current task (must be in a worktree with `.kanclaw-task`).

```
/done
```

- Commits uncommitted changes (asks first)
- Creates a PR with conventional commit title
- Adds PR link as comment on the KanClaw task
- Moves task to `review`
- Offers worktree cleanup

### `/pr`

Create a PR with KanClaw context (lighter — no task status change).

```
/pr
```

- Works with or without `.kanclaw-task`
- Pushes and creates PR via `gh`
- Links PR to task if context exists
- Does NOT move the task

## Hooks

| Hook | Event | What it does |
|------|-------|-------------|
| **SessionStart** | Session begins | Detects `.kanclaw-task` and injects task context. Checks MCP connectivity. |
| **PostToolUse** | After `Bash` | Detects `git push` commands and reminds to create a release. |
| **Stop** | Session ending | Checks if tasks were left in-progress without being moved to review. |

## Configuration

### MCP Server

The MCP server connects via your project `.mcp.json` or user `~/.claude.json`. See [Quick Start](#2-connect-the-mcp-server) for setup.

For local development, point to your local server:

```json
{
  "mcpServers": {
    "kanclaw": {
      "type": "http",
      "url": "http://localhost:8788/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_DEV_API_KEY"
      }
    }
  }
}
```

A template is included at `mcp.json.template` in the plugin directory.

## MCP Tools Overview

The KanClaw MCP server provides 32 tools organized by category:

| Category | Tools | Key tools |
|----------|-------|-----------|
| **Tasks** | 12 | `list_tasks`, `get_task`, `create_task`, `move_task` |
| **Checklists** | 1 | `manage_checklist` (add, toggle, update, delete, reorder) |
| **Dependencies** | 1 | `manage_dependencies` (add, remove, list + cycle detection) |
| **Labels** | 1 | `manage_labels` (list, create, update, delete, reorder) |
| **Board & Project** | 4 | `get_board`, `list_boards`, `get_project_summary`, `list_roles` |
| **Epics** | 4 | `list_epics`, `create_epic`, `update_epic`, `delete_epic` |
| **Releases** | 3 | `create_release`, `list_releases`, `get_release` |
| **Context Docs** | 4 | `list_docs`, `get_doc`, `get_role_context`, `update_doc` |
| **GitHub** | 2 | `link_pr`, `get_pr_status` (stubs) |

Plus 3 MCP resources: `kanclaw://board/{slug}`, `kanclaw://docs`, `kanclaw://activity`

Run `/kanclaw` for the full skill guide with workflow patterns and examples.

## Troubleshooting

### MCP not showing in `/mcp`

The MCP server must be configured separately from the plugin. Add it to your project's `.mcp.json`:

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

### Commands not found

If `/worktree` doesn't appear, check the plugin is installed:
```
/plugin list
```

### Duplicate skill

If `/kanclaw` appears twice, you may have a standalone skill at `~/.claude/skills/kanclaw/`. Remove it:
```bash
rm -rf ~/.claude/skills/kanclaw
```

### `gh` not installed

The `/done` and `/pr` commands use the GitHub CLI:
```bash
brew install gh
gh auth login
```

## License

MIT
