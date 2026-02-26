#!/usr/bin/env node

// Context Guardian — StatusLine Hook
// Monitors context window usage, persists session state, and renders a
// colored progress bar in Claude Code's statusline.

const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------------------------------------------------------------------------
// Read JSON from stdin
// ---------------------------------------------------------------------------
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);

    const sessionId = data.session_id;
    const model = data.model || {};
    const workspace = data.workspace || {};
    const ctxWindow = data.context_window || {};
    const rawRemaining = ctxWindow.remaining_percentage;
    const remainingPct = typeof rawRemaining === 'number' ? rawRemaining : null;

    // -----------------------------------------------------------------------
    // Calculate scaled used% (Claude Code hard-caps at 80%)
    // -----------------------------------------------------------------------
    let used = 0;
    if (remainingPct != null) {
      const rawUsed = Math.max(0, Math.min(100, 100 - remainingPct));
      used = Math.min(100, Math.round((rawUsed / 80) * 100));
    }

    // -----------------------------------------------------------------------
    // Determine alert level
    // IMPORTANT: thresholds must match getLevel() in post-tool-check.cjs
    // -----------------------------------------------------------------------
    let level = 0;
    if (used >= 95) level = 3;
    else if (used >= 85) level = 2;
    else if (used >= 75) level = 1;

    // -----------------------------------------------------------------------
    // Persist session state to disk
    // -----------------------------------------------------------------------
    if (sessionId) {
      const stateDir = path.join(os.homedir(), '.claude', 'context-guardian', 'sessions');
      try {
        fs.mkdirSync(stateDir, { recursive: true });
        const stateFile = path.join(stateDir, `session-${sessionId}.json`);
        fs.writeFileSync(stateFile, JSON.stringify({
          used,
          level,
          session_id: sessionId,
          ts: Date.now(),
        }));

        // Cleanup stale session files older than 24 hours (~5% of runs to avoid unnecessary I/O)
        if (Math.random() < 0.05) {
          const now = Date.now();
          const MAX_AGE_MS = 24 * 60 * 60 * 1000;
          try {
            for (const file of fs.readdirSync(stateDir)) {
              if (file === `session-${sessionId}.json` || file === `notified-${sessionId}.json`) continue;
              const filePath = path.join(stateDir, file);
              const stat = fs.statSync(filePath);
              if (now - stat.mtimeMs > MAX_AGE_MS) {
                fs.unlinkSync(filePath);
              }
            }
          } catch (_) {
            // Best-effort cleanup
          }
        }
      } catch (_) {
        // Best-effort — never break statusline for a file write failure
      }
    }

    // -----------------------------------------------------------------------
    // Render statusline with colored progress bar
    // -----------------------------------------------------------------------
    const filled = Math.round(used / 10);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);

    // ANSI colors based on usage thresholds
    let color;
    let prefix = '';
    if (used >= 95) {
      color = '\x1b[5;31m'; // red + blink
      prefix = '\uD83D\uDC80 '; // skull emoji
    } else if (used >= 81) {
      color = '\x1b[38;5;208m'; // orange
    } else if (used >= 63) {
      color = '\x1b[33m'; // yellow
    } else {
      color = '\x1b[32m'; // green
    }

    const reset = '\x1b[0m';
    const dim = '\x1b[2m';

    const modelName = model.display_name || model.id || 'Claude';
    const dirname = workspace.current_dir ? path.basename(workspace.current_dir) : '';

    const parts = [
      `${dim}${modelName}${reset}`,
      dirname ? `${dim}${dirname}${reset}` : null,
      `${color}${prefix}${bar} ${used}%${reset}`,
    ].filter(Boolean);

    process.stdout.write(parts.join(' \u2502 '));
  } catch (_) {
    // Silent failure — never break Claude Code statusline
  }
});
