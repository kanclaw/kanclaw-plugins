# Context Guardian

## The Problem

Claude Code conversations have a finite context window. When it fills up, Claude Code auto-compacts -- silently summarizing and discarding older messages. This means:

- **Work gets lost mid-task.** Claude forgets what it was doing, why it was doing it, and what's left.
- **No warning before it happens.** You go from "productive session" to "who are you and what are we building?" with no transition.
- **No graceful handoff.** There's no mechanism for Claude to document its state, save notes, or prepare a continuation plan before the context is wiped.

Even with persistent memory tools like claude-mem, the sudden context loss disrupts flow. The problem isn't that context is finite -- it's that there's no protocol for winding down gracefully.

## The Solution

Context Guardian gives Claude self-awareness of its context usage and a clear protocol for winding down. Instead of hitting the wall mid-sentence, Claude receives escalating warnings that shift its behavior:

1. **At 75%** -- "Heads up. Start wrapping up, don't begin anything big."
2. **At 85%** -- "Wind down. Finish what's in progress, nothing new."
3. **At 95%** -- "Emergency. Write everything down, give the user a continuation prompt, suggest `/clear`."

The result: every session ends with a handoff file documenting what was done, what's left, and the exact prompt to continue. No work lost, no context wasted.

## How It Works

Two scripts, two hooks -- a sensor and an actuator:

- **`statusline.cjs`** (StatusLine hook) -- The sensor. Runs on every statusline render. Reads `context_window.remaining_percentage` from Claude Code's stdin, calculates the scaled usage percentage, persists session state to disk, and renders a colored progress bar.

- **`post-tool-check.cjs`** (PostToolUse hook) -- The actuator. Runs after every tool call. Reads the session state and, when a threshold is crossed, injects a system-level warning into Claude's context via `additionalContext`. Fires once per level transition to avoid spam.

### Key Design Decisions

- **Statusline writes, PostToolUse reads.** The StatusLine hook is the only one that receives `context_window` data from Claude Code. PostToolUse hooks don't get this data, so we persist it to a file that the PostToolUse hook reads. This two-file architecture is the core of the plugin.

- **Scaled percentage.** Claude Code enforces an 80% hard limit on context. We scale the display so that 80% real = 100% shown. The user sees a percentage that matches their intuition ("100% means full").

- **One-shot warnings.** Each level fires exactly once. If we notified at 75%, we don't re-notify until 85% is crossed. This prevents spam while ensuring every threshold change is communicated.

- **Advisory, not blocking.** The plugin never executes `/clear` or `/compact` for you. It injects messages that Claude reads and acts on. The user makes the final call.

- **claude-mem detection.** At Level 3, the plugin checks if claude-mem is installed. If yes, the emergency message notes that persistent memory is active. If not, it emphasizes that everything must be written to the handoff file.

## Alert Levels

| Level | Threshold | Action |
|-------|-----------|--------|
| 0 | < 75% | Normal operation |
| 1 | >= 75% | Wrap up current work, avoid starting new tasks |
| 2 | >= 85% | Finish in-progress work only, no new work |
| 3 | >= 95% | Write handoff summary and suggest `/clear` |

Levels are one-way during a session -- once escalated, the level never drops back down.

## Installation

Via the KanClaw plugin marketplace:

```
/plugin marketplace add kanclaw/kanclaw-plugins
```

Or manually: copy the `context-guardian` directory to `~/.claude/plugins/cache/` and register it in `installed_plugins.json`.

## Session Data

All state is stored in `~/.claude/context-guardian/`:

- `sessions/` -- Per-session state files (current alert level, context percentage, timestamps). Auto-cleaned after 24 hours.
- `handoffs/` -- Handoff summaries written by Claude at Level 3.

This directory lives outside any repository. Context Guardian never reads or writes files in your project.

## Dependencies

None. Pure Node.js with no external packages. Uses only `fs`, `path`, and `os` from the standard library.

## Compatibility

Context Guardian operates independently through its own hooks and state directory. It works alongside other Claude Code plugins -- claude-mem, KanClaw, or any combination -- without conflicts.

**Note on GSD StatusLine**: If you use GSD's statusline (which also displays a context bar), there may be duplicate context displays. The PostToolUse warning hook works regardless of which statusline renders the bar, as long as one writes the session state file.
