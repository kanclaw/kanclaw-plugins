---
name: context-status
description: "Check current context window usage. Use when the user asks about context usage, remaining context, how much context is left, or similar questions about the current session's context window."
---

# Context Status

Read the current context window usage from the Context Guardian session state file.

## How to check

Read the file at `~/.claude/context-guardian/sessions/session-{SESSION_ID}.json` where `{SESSION_ID}` is the current session ID.

The file contains:
```json
{
  "used": 78,
  "level": 1,
  "session_id": "abc123",
  "ts": 1709000000000
}
```

## Fields

- `used` — Scaled context usage percentage (0-100). This is scaled from the real usage: Claude Code hard-caps at 80% real context, so 80% real = 100% displayed.
- `level` — Alert level: 0 (normal), 1 (heads up, >= 75%), 2 (wind down, >= 85%), 3 (emergency, >= 95%)
- `ts` — Timestamp of last update (updated on every statusline refresh)

## How to respond

Report the usage to the user in a clear format. Examples:

**Normal (level 0):**
> Context usage: 45%. Plenty of room.

**Heads up (level 1):**
> Context usage: 78%. Getting there — I'm wrapping up current work and avoiding new big tasks.

**Wind down (level 2):**
> Context usage: 87%. I'm finishing what's in progress and preparing handoff notes.

**Emergency (level 3):**
> Context usage: 96%. Critical — I need to write the handoff file and you should /clear soon.

## If the file doesn't exist

The session state file is written by the Context Guardian statusline hook. If it doesn't exist, respond:

> I can't check context usage right now — the Context Guardian statusline hook hasn't written any state for this session yet. The statusline needs to be configured and running for context tracking to work.
