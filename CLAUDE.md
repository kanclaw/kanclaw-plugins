# KanClaw Plugin

This project uses KanClaw for AI agent task orchestration. The KanClaw MCP server is connected and provides 33 tools for managing tasks, boards, epics, releases, and more.

## Quick Reference

- **Board:** `get_board` to see current state
- **Tasks:** `list_tasks` (filtered) or `get_task` (full details)
- **Work flow:** `move_task` to `in-progress` FIRST, then work, then `move_task` to `review`
- **Comments:** `add_comment` to document decisions and progress
- **Releases:** `create_release` after pushing to main

See the KanClaw skill (`/kanclaw`) for full workflow documentation.
