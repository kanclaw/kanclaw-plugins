# Context Guardian — Plugin Spec

## Purpose
Claude Code plugin that monitors context window usage and orchestrates a graceful wind-down when approaching limits. Ensures no work is lost by writing a handoff document and providing a continuation prompt.

## Plugin Structure
```
packages/context-guardian/
├── .claude-plugin/
│   └── marketplace.json       # Plugin manifest
├── scripts/
│   ├── statusline.cjs         # Writes context % per session
│   └── post-tool-check.cjs    # Reads % and injects warnings by level
├── skills/
│   └── context-status/
│       └── SKILL.md           # Skill for querying context usage
├── SPEC.md                    # This file
└── README.md                  # User-facing docs
```

## How It Works

### Data Flow
```
Claude Code statusline refresh
  → stdin JSON with context_window.remaining_percentage
  → statusline.cjs calculates scaled used%
  → Writes to ~/.claude/context-guardian/sessions/session-{id}.json
  → Returns statusline text with visual progress bar

Claude uses any tool
  → PostToolUse fires post-tool-check.cjs
  → Reads session-{id}.json
  → If level CHANGED (not repeated) → injects additionalContext
  → Claude receives the warning and acts accordingly
```

### Session State Files
Two files per session in `~/.claude/context-guardian/sessions/`:

**`session-{id}.json`** — Written by `statusline.cjs`:
```json
{
  "used": 78,
  "level": 1,
  "session_id": "abc123",
  "ts": 1709000000000
}
```

**`notified-{id}.json`** — Written by `post-tool-check.cjs`:
```json
{
  "last_notified_level": 1
}
```

### Alert Levels

| Level | Threshold | Name       | Behavior |
|-------|-----------|------------|----------|
| 0     | < 75%     | Normal     | No injection. Statusline shows green/yellow bar. |
| 1     | >= 75%    | Heads up   | Inject ONCE: "Context at 75%. Wrap up current work. Don't start big new tasks." |
| 2     | >= 85%    | Wind down  | Inject ONCE: "Context at 85%. Finish what's in progress. Don't accept new work. Prepare for handoff." |
| 3     | >= 95%    | Emergency  | Inject ONCE: "Context at 95%. STOP. Write handoff now. Document everything pending. Generate continuation prompt." |

Key: Messages are injected only when level INCREASES, not on every tool call.

### Statusline Visual
```
Claude Opus 4.6 │ project-name █████████░ 78%     (green < 63%)
Claude Opus 4.6 │ project-name █████████░ 78%     (yellow 63-80%)
Claude Opus 4.6 │ project-name █████████░ 85%     (orange 81-94%)
Claude Opus 4.6 │ project-name 💀 █████████░ 96%  (red+blink >= 95%)
```

### Handoff File
Location: `~/.claude/context-guardian/handoffs/handoff-{session}.md`

Written by Claude (not the plugin) when it receives the Level 3 message. The Level 3 injection tells Claude to write this file with:
- What was in progress
- What's left to do
- Continuation prompt

### claude-mem Detection
The PostToolUse hook checks for claude-mem presence (looks for `~/.claude/plugins/cache/thedotmack/claude-mem/`). If found, Level 3 message adds: "claude-mem is active — your important observations are already persisted."

### What This Plugin Does NOT Do
- Does NOT execute /clear or /compact
- Does NOT depend on GSD, KanClaw, or any other plugin
- Does NOT touch the user's repo (everything in ~/.claude/)
- Does NOT block Claude — these are advisory messages

## marketplace.json
```json
{
  "name": "context-guardian",
  "description": "Graceful context wind-down with handoff for Claude Code",
  "owner": { "name": "kanclaw" },
  "plugins": [
    {
      "name": "context-guardian",
      "source": "./",
      "hooks": {
        "StatusLine": [
          {
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/statusline.cjs\"",
            "timeout": 2000
          }
        ],
        "PostToolUse": [
          {
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/post-tool-check.cjs\"",
            "matcher": "*",
            "timeout": 1000
          }
        ]
      }
    }
  ]
}
```

## Implementation Notes

### Scaling Formula
Claude Code enforces an 80% hard context limit. Scale display:
```javascript
const rawUsed = 100 - remaining_percentage;
const used = Math.min(100, Math.round((rawUsed / 80) * 100));
```

### Session ID Access
- statusline.cjs: receives `session_id` in stdin JSON
- post-tool-check.cjs: receives `session_id` in stdin JSON (PostToolUse hook input)

### Avoiding Spam
- Track `last_notified_level` in a separate `notified-{id}.json` file
- Only inject when `current_level > last_notified_level`
- Reset only on session change (new session file)

### Session Cleanup
- Statusline runs cleanup ~5% of renders (probabilistic, avoids unnecessary I/O)
- Deletes session + notified files older than 24 hours
- Skips current session's files

### Error Handling
- All file operations wrapped in try/catch
- Silent failures — never break Claude Code
- Missing session file = level 0 (no warning)
