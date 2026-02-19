# Changelog

## 0.1.0 (2026-02-19)

### Features
- **Skill** — Full KanClaw workflow guide (`/kanclaw`): task lifecycle, epics, releases, checklists, dependencies, labels, human handoff, context docs, multi-agent coordination
- **Tool Reference** — Compact 32-tool + 3-resource reference (auto-loaded with skill)
- **Commands** — `/worktree` (git worktree + branch for task), `/done` (PR + review + cleanup), `/pr` (lightweight PR), `/setup-kc` (MCP onboarding)
- **Hooks** — SessionStart (task context + MCP status), PostToolUse on Bash (git push release reminder), PostToolUse on get_task (auto in-progress reminder), PreToolUse on EnterPlanMode (ensure task locked), PostToolUse on ExitPlanMode (post plan as comment), Stop (task status check)
- **MCP config template** — `mcp.json.template` with env var placeholders

### Infrastructure
- Plugin manifest (`.claude-plugin/plugin.json`)
- Marketplace config (`.claude-plugin/marketplace.json`)
- MIT license
