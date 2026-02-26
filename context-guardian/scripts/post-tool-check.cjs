#!/usr/bin/env node

// Context Guardian — PostToolUse Hook
//
// Reads session state (written by the statusline script) and injects
// context-window warnings to Claude when usage crosses threshold levels.
// Fires once per level transition to avoid spamming.

const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GUARDIAN_DIR = path.join(os.homedir(), '.claude', 'context-guardian');
const SESSIONS_DIR = path.join(GUARDIAN_DIR, 'sessions');
const HANDOFFS_DIR = path.join(GUARDIAN_DIR, 'handoffs');

const SUPPRESS = JSON.stringify({ continue: true, suppressOutput: true });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Determine the current warning level from a usage percentage. 0 = no warning.
 *  IMPORTANT: thresholds must match level logic in statusline.cjs */
function getLevel(used) {
  if (used >= 95) return 3;
  if (used >= 85) return 2;
  if (used >= 75) return 1;
  return 0;
}

/** Safely read and parse a JSON file. Returns null on any failure. */
function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

/** Safely write a JSON file, creating parent directories as needed. Returns true on success. */
function writeJson(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

/** Check whether claude-mem plugin is installed. */
function isClaudeMemActive() {
  try {
    const cacheDir = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'thedotmack', 'claude-mem');
    return fs.existsSync(cacheDir);
  } catch {
    return false;
  }
}

/** Build the warning message for a given level and usage percentage. */
function buildWarning(level, used, sessionId) {
  switch (level) {
    case 1:
      return [
        '\u26a0\ufe0f CONTEXT GUARDIAN \u2014 Heads Up (75%)',
        `Context window is at ${used}%. Start wrapping up your current work. Avoid starting large new tasks. Focus on completing what's already in progress.`,
      ].join('\n');

    case 2:
      return [
        '\ud83d\udfe0 CONTEXT GUARDIAN \u2014 Wind Down (85%)',
        `Context window is at ${used}%. Finish what you have in progress NOW. Do NOT accept any new work. Start preparing your handoff notes \u2014 document what you were doing and what remains.`,
      ].join('\n');

    case 3: {
      const claudeMemNote = isClaudeMemActive()
        ? 'Note: claude-mem is active. Your important observations from this session are already persisted in memory.'
        : 'Important: There is no persistent memory system. Make sure ALL important context is written to the handoff file.';

      return [
        '\ud83d\udd34 CONTEXT GUARDIAN \u2014 Emergency Save (95%)',
        `Context window is at ${used}%. STOP all work immediately.`,
        '',
        'You MUST do the following RIGHT NOW:',
        `1. Write a handoff file to ~/.claude/context-guardian/handoffs/handoff-${sessionId}.md with:`,
        '   - What you were working on',
        '   - Current state of each task',
        '   - What remains to be done',
        '   - The exact prompt the user should paste to continue',
        '2. Tell the user to run /clear and paste the continuation prompt',
        '',
        claudeMemNote,
      ].join('\n');
    }

    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // Read the hook input from stdin
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });

  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input);
      const sessionId = data.session_id;

      if (!sessionId) {
        process.stdout.write(SUPPRESS);
        return;
      }

      // Read session state written by the statusline script
      const stateFile = path.join(SESSIONS_DIR, `session-${sessionId}.json`);
      const state = readJson(stateFile);

      // Field name must match what statusline.js writes: "used"
      if (!state || typeof state.used !== 'number') {
        process.stdout.write(SUPPRESS);
        return;
      }

      const used = state.used;
      const currentLevel = getLevel(used);

      // Level 0 means we're below all thresholds — nothing to warn about
      if (currentLevel === 0) {
        process.stdout.write(SUPPRESS);
        return;
      }

      // Check what level we last notified at for this session
      const notifiedFile = path.join(SESSIONS_DIR, `notified-${sessionId}.json`);
      const notifiedState = readJson(notifiedFile) || { last_notified_level: 0 };
      const lastNotifiedLevel = notifiedState.last_notified_level || 0;

      // Only inject a warning when crossing into a NEW, higher level
      if (currentLevel <= lastNotifiedLevel) {
        process.stdout.write(SUPPRESS);
        return;
      }

      // Build the warning and inject it
      const warning = buildWarning(currentLevel, used, sessionId);

      // Update the notification tracking file BEFORE output.
      // If write fails, suppress to avoid spamming the same warning repeatedly.
      const written = writeJson(notifiedFile, { last_notified_level: currentLevel });
      if (!written) {
        process.stdout.write(SUPPRESS);
        return;
      }

      // Ensure handoffs directory exists (Level 3 tells Claude to write there)
      if (currentLevel === 3) {
        try {
          fs.mkdirSync(HANDOFFS_DIR, { recursive: true });
        } catch {
          // Best-effort
        }
      }

      // Output the hook response with the warning injected as additional context
      const response = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: warning,
        },
      };

      process.stdout.write(JSON.stringify(response));
    } catch {
      process.stdout.write(SUPPRESS);
    }
  });
}

// Wrap everything — never let an unhandled error crash Claude Code
try {
  main();
} catch {
  process.stdout.write(SUPPRESS);
}
